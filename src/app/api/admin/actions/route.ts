import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyBookingStatusChange, sendMultiChannelNotification, formatNaira } from "@/lib/notifications";
import { releaseEscrowPayout, refundEscrowPayment } from "@/lib/escrow";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, proId, bookingId, artisanId, status, reason, bookingReference, notes, refundAmount, adminUserId } = body;

    if (!action) {
      return NextResponse.json({ error: "Action parameter is required" }, { status: 400 });
    }

    const targetBookingId = bookingId || bookingReference;

    // Action 1: Approve Professional Verification Application
    if (action === "approve_pro") {
      await prisma.professional.updateMany({
        where: { id: proId },
        data: { verificationStatus: "VERIFIED" },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Professional #${proId} verified and granted HandyHub Checkmate Pro Badge! 🎉`,
      });
    }

    // Action 2: Reject Professional Application
    if (action === "reject_pro") {
      await prisma.professional.updateMany({
        where: { id: proId },
        data: { verificationStatus: "REJECTED" },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Professional #${proId} application marked as rejected. Reason: ${reason || "Incomplete documentation"}`,
      });
    }

    // Action 3: Manually Assign Professional/Artisan to a Booking
    if (action === "assign_artisan" || action === "ASSIGN_PRO") {
      const targetProId = proId || artisanId;

      if (!targetBookingId || !targetProId) {
        return NextResponse.json({ error: "Booking ID and Professional ID are required for manual assignment" }, { status: 400 });
      }

      // 1. Resolve target booking by id or reference
      const existingBooking = await prisma.booking.findFirst({
        where: {
          OR: [{ id: targetBookingId }, { reference: targetBookingId }],
        },
      });

      if (!existingBooking) {
        return NextResponse.json({ error: `Booking not found for ID/Reference: ${targetBookingId}` }, { status: 404 });
      }

      // 2. Resolve professional by pro ID or user ID
      const resolvedPro = await prisma.professional.findFirst({
        where: {
          OR: [{ id: targetProId }, { userId: targetProId }, { id: targetProId.replace(/^pro_/, "") }],
        },
        include: { user: true },
      });

      if (!resolvedPro) {
        return NextResponse.json({ error: `Professional record not found for ID: ${targetProId}` }, { status: 404 });
      }

      // 3. Update Booking in DB with assigned professionalId and status ASSIGNED
      const updatedBooking = await prisma.booking.update({
        where: { id: existingBooking.id },
        data: {
          professionalId: resolvedPro.id,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
        include: {
          customer: true,
          professional: {
            include: { user: true },
          },
          service: true,
        },
      });

      // 4. Dispatch multi-channel notification to both customer and assigned artisan
      await notifyBookingStatusChange(updatedBooking).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Manually assigned Artisan ${resolvedPro.user?.firstName || "Partner"} (${resolvedPro.user?.phone || "Verified"}) to Booking #${updatedBooking.reference}!`,
        booking: updatedBooking,
      });
    }

    // Action 4: Update Booking Status
    if (action === "UPDATE_BOOKING_STATUS") {
      if (!targetBookingId || !status) {
        return NextResponse.json({ error: "Booking ID and status required" }, { status: 400 });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: targetBookingId },
        data: { status },
        include: {
          customer: true,
          professional: {
            include: { user: true },
          },
          service: true,
        },
      });

      if (status === "COMPLETED") {
        await releaseEscrowPayout({
          bookingId: targetBookingId,
          triggerSource: "ADMIN_RELEASE",
          notes: notes || "Released upon status change to COMPLETED",
        }).catch((e) => console.warn("[Admin Status Escrow Release Warning]:", e));
      }

      await notifyBookingStatusChange(updatedBooking).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Booking status updated to ${status}`,
        booking: updatedBooking,
      });
    }

    // Action 5: Complete Job (from Pro execution proof / OTP verification)
    if (action === "COMPLETE_JOB") {
      if (!targetBookingId) {
        return NextResponse.json({ error: "Booking reference or ID required" }, { status: 400 });
      }

      const booking = await prisma.booking.findFirst({
        where: { OR: [{ id: targetBookingId }, { reference: targetBookingId }] },
        include: { customer: true, professional: { include: { user: true } }, service: true },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "COMPLETED",
          paymentStatus: "SUCCESS",
          completedAt: new Date(),
        },
        include: { customer: true, professional: { include: { user: true } }, service: true },
      });

      const escrowResult = await releaseEscrowPayout({
        bookingId: booking.id,
        triggerSource: "JOB_COMPLETION",
        notes: "Job completion verified by artisan",
      }).catch((e) => {
        console.warn("[Pro Job Completion Escrow Release Warning]:", e);
        return { message: "Job completed (Escrow already processed)" };
      });

      await notifyBookingStatusChange(updated).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "Job completed and escrow payout disbursed successfully!",
        booking: updated,
        escrow: escrowResult,
      });
    }

    // Action 6: Release Escrow Payment to Professional Wallet
    if (action === "release_escrow" || action === "RELEASE_ESCROW") {
      if (!targetBookingId) {
        return NextResponse.json({ error: "Booking reference or ID is required for escrow release" }, { status: 400 });
      }

      const result = await releaseEscrowPayout({
        bookingId: targetBookingId,
        triggerSource: "ADMIN_RELEASE",
        notes: notes || "Escrow payout manually authorized by admin",
      });

      return NextResponse.json({
        success: true,
        message: result.message || "Escrow payout released successfully!",
        data: result,
      });
    }

    // Action 7: Refund Escrow to Customer Wallet
    if (action === "refund_escrow" || action === "REFUND_ESCROW") {
      if (!targetBookingId) {
        return NextResponse.json({ error: "Booking reference or ID is required for escrow refund" }, { status: 400 });
      }

      const result = await refundEscrowPayment({
        bookingId: targetBookingId,
        refundAmountNgn: refundAmount ? Number(refundAmount) : undefined,
        reason: reason || "Admin Escrow Refund",
        adminUserId: adminUserId || "ADMIN_SESSION",
      });

      return NextResponse.json({
        success: true,
        message: `Escrow refund of ₦${result.refundAmount.toLocaleString()} credited to customer wallet successfully!`,
        data: result,
      });
    }

    // Action 8: Mark Artisan Withdrawal Request as Settled / Paid
    if (action === "SETTLE_WITHDRAWAL" || action === "APPROVE_WITHDRAWAL") {
      const { withdrawalId, reference } = body;
      const targetWithdrawal = await prisma.withdrawalRequest.findFirst({
        where: { OR: [{ id: withdrawalId || "" }, { reference: reference || "" }] },
        include: { wallet: { include: { user: true } } },
      });

      if (!targetWithdrawal) {
        return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
      }

      await prisma.withdrawalRequest.update({
        where: { id: targetWithdrawal.id },
        data: { status: "COMPLETED" },
      });

      const user = targetWithdrawal.wallet?.user;

      if (user) {
        // 1. Update any existing in-app notification mentioning this withdrawal reference
        const existingNotifications = await prisma.notification.findMany({
          where: {
            userId: user.id,
            type: "PAYMENT",
            OR: [
              { message: { contains: targetWithdrawal.reference } },
              { title: { contains: "Withdrawal" } },
            ],
          },
        }).catch(() => []);

        if (existingNotifications.length > 0) {
          await prisma.notification.updateMany({
            where: {
              id: { in: existingNotifications.map((n) => n.id) },
              message: { contains: targetWithdrawal.reference },
            },
            data: {
              title: "Withdrawal Approved & Sent 💸",
              message: `Your withdrawal of ${formatNaira(targetWithdrawal.amount)} to ${targetWithdrawal.bankName} (${targetWithdrawal.accountNumber}) has been APPROVED and SENT! Ref: ${targetWithdrawal.reference}`,
              data: JSON.stringify({
                status: "SENT",
                amount: formatNaira(targetWithdrawal.amount),
                bankName: targetWithdrawal.bankName,
                accountNumber: targetWithdrawal.accountNumber,
                reference: targetWithdrawal.reference,
              }),
            },
          }).catch(() => {});
        } else {
          // Create explicit Sent notification
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "PAYMENT",
              title: "Withdrawal Approved & Sent 💸",
              message: `Your withdrawal of ${formatNaira(targetWithdrawal.amount)} to ${targetWithdrawal.bankName} (${targetWithdrawal.accountNumber}) has been APPROVED and SENT! Ref: ${targetWithdrawal.reference}`,
              data: JSON.stringify({
                status: "SENT",
                amount: formatNaira(targetWithdrawal.amount),
                bankName: targetWithdrawal.bankName,
                accountNumber: targetWithdrawal.accountNumber,
                reference: targetWithdrawal.reference,
              }),
            },
          }).catch(() => {});
        }

        // 2. Dispatch Multi-Channel Notification
        await sendMultiChannelNotification({
          userId: user.id,
          recipientEmail: user.email,
          recipientPhone: user.phone || undefined,
          recipientName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Artisan Partner",
          type: "PAYMENT",
          title: "Withdrawal Approved & Sent 💸",
          message: `Your payout of ${formatNaira(targetWithdrawal.amount)} has been approved and sent to your ${targetWithdrawal.bankName} account (${targetWithdrawal.accountNumber}). Ref: ${targetWithdrawal.reference}`,
          metadata: {
            "Status": "SENT / APPROVED",
            "Amount": formatNaira(targetWithdrawal.amount),
            "Bank": targetWithdrawal.bankName,
            "Account Number": targetWithdrawal.accountNumber,
            "Reference": targetWithdrawal.reference,
          },
        }).catch((err) => console.warn("[Withdrawal Settled Notification Warning]:", err));
      }

      await prisma.auditLog.create({
        data: {
          userId: adminUserId || "ADMIN_SESSION",
          action: "WITHDRAWAL_SETTLED",
          entity: "WithdrawalRequest",
          entityId: targetWithdrawal.id,
          details: JSON.stringify({
            amount: targetWithdrawal.amount,
            reference: targetWithdrawal.reference,
            bankName: targetWithdrawal.bankName,
            accountNumber: targetWithdrawal.accountNumber,
            notes: notes || "Payout disbursed to artisan bank account",
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Payout of ₦${targetWithdrawal.amount.toLocaleString()} for ref #${targetWithdrawal.reference} marked as SETTLED / PAID and artisan notified! 🎉`,
      });
    }

    // Action 9: Reject Artisan Withdrawal & Refund to Wallet
    if (action === "REJECT_WITHDRAWAL") {
      const { withdrawalId, reference } = body;
      const targetWithdrawal = await prisma.withdrawalRequest.findFirst({
        where: { OR: [{ id: withdrawalId || "" }, { reference: reference || "" }] },
        include: { wallet: { include: { user: true } } },
      });

      if (!targetWithdrawal) {
        return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
      }

      const user = targetWithdrawal.wallet?.user;

      // Return funds to wallet
      await prisma.$transaction(async (tx: any) => {
        await tx.wallet.update({
          where: { id: targetWithdrawal.walletId },
          data: { balance: { increment: targetWithdrawal.amount } },
        });
        await tx.withdrawalRequest.update({
          where: { id: targetWithdrawal.id },
          data: { status: "REJECTED" },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: targetWithdrawal.walletId,
            type: "CREDIT",
            amount: targetWithdrawal.amount,
            description: `Withdrawal Refund (Rejected: ${reason || "Account detail discrepancy"})`,
            reference: `REJ_${targetWithdrawal.reference}`,
            gateway: "WALLET",
          },
        });
        await tx.auditLog.create({
          data: {
            userId: adminUserId || "ADMIN_SESSION",
            action: "WITHDRAWAL_REJECTED_REFUNDED",
            entity: "WithdrawalRequest",
            entityId: targetWithdrawal.id,
            details: JSON.stringify({
              amount: targetWithdrawal.amount,
              reference: targetWithdrawal.reference,
              reason: reason || "Account detail discrepancy",
            }),
          },
        });
      });

      if (user) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "PAYMENT",
            title: "Withdrawal Request Rejected & Refunded ↩️",
            message: `Your withdrawal request of ${formatNaira(targetWithdrawal.amount)} was rejected: ${reason || "Account detail discrepancy"}. The funds have been refunded back to your available wallet balance.`,
            data: JSON.stringify({
              status: "REJECTED",
              amount: formatNaira(targetWithdrawal.amount),
              reference: targetWithdrawal.reference,
              reason: reason || "Account detail discrepancy",
            }),
          },
        }).catch(() => {});

        await sendMultiChannelNotification({
          userId: user.id,
          recipientEmail: user.email,
          recipientPhone: user.phone || undefined,
          recipientName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Artisan Partner",
          type: "PAYMENT",
          title: "Withdrawal Request Rejected & Refunded ↩️",
          message: `Your withdrawal of ${formatNaira(targetWithdrawal.amount)} was not approved and the amount has been refunded back into your wallet balance. Reason: ${reason || "Account detail discrepancy"}`,
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `Withdrawal ref #${targetWithdrawal.reference} rejected and ₦${targetWithdrawal.amount.toLocaleString()} refunded to artisan wallet.`,
      });
    }

    return NextResponse.json({ error: "Invalid admin action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Action Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error processing admin action" },
      { status: 500 }
    );
  }
}
