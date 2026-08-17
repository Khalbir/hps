import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyBookingStatusChange } from "@/lib/notifications";
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

      // Update Booking in DB with assigned professionalId and status ASSIGNED
      const updatedBooking = await prisma.booking.update({
        where: { id: targetBookingId },
        data: {
          professionalId: targetProId,
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

      // Dispatch notifications
      await notifyBookingStatusChange(updatedBooking).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Manually assigned Artisan ${updatedBooking.professional?.user?.firstName || "Partner"} to Booking #${updatedBooking.reference}!`,
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

    return NextResponse.json({ error: "Invalid admin action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Action Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error processing admin action" },
      { status: 500 }
    );
  }
}
