import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVoucherCode, logPartAudit, findSupplierForCategory } from "@/lib/parts";
import { sendArtisanPartVoucherAlert } from "@/lib/whatsapp";
import { sendMultiChannelNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      partId,
      action, // "APPROVE" or "REJECT"
      rejectionReason,
      paymentMethod = "PAYSTACK", // "PAYSTACK" or "WALLET"
      paymentReference,
      customerId,
    } = body;

    if (!partId || !action) {
      return NextResponse.json(
        { error: "Part ID and action (APPROVE or REJECT) are required." },
        { status: 400 }
      );
    }

    const part = await prisma.replacementPart.findUnique({
      where: { id: partId },
      include: {
        customer: true,
        professional: { include: { user: true } },
        supplier: true,
        booking: { include: { service: true } },
      },
    });

    if (!part) {
      return NextResponse.json({ error: "Replacement part request not found." }, { status: 404 });
    }

    if (part.status !== "REQUESTED") {
      return NextResponse.json(
        { error: `This part request has already been processed (Current status: ${part.status}).` },
        { status: 400 }
      );
    }

    // Customer Identity check if provided
    if (customerId && part.customerId !== customerId) {
      return NextResponse.json(
        { error: "Unauthorized: You can only authorize part requests for your own booking." },
        { status: 403 }
      );
    }

    // =========================================================================
    // CASE A: REJECTION
    // =========================================================================
    if (action.toUpperCase() === "REJECT") {
      const updatedPart = await prisma.replacementPart.update({
        where: { id: partId },
        data: {
          status: "REJECTED",
          customerRejectionReason: rejectionReason?.trim() || "Customer declined part replacement.",
        },
      });

      await logPartAudit({
        partId: part.id,
        actorId: part.customerId,
        actorRole: "CUSTOMER",
        action: "REJECTED",
        notes: `Customer rejected part replacement request. Reason: ${rejectionReason || "None provided"}`,
      });

      // Notify artisan of rejection
      if (part.professional?.user?.id) {
        await sendMultiChannelNotification({
          userId: part.professional.user.id,
          type: "BOOKING",
          title: "❌ Part Request Declined by Client",
          message: `The client declined the replacement request for ${part.partName}. Please proceed with existing components or discuss alternatives.`,
          bookingRef: part.booking.reference,
          metadata: { partId: part.id, status: "REJECTED" },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Replacement part request rejected.",
        part: updatedPart,
      });
    }

    // =========================================================================
    // CASE B: APPROVAL & ZERO-CASH ESCROW PAYMENT
    // =========================================================================
    if (action.toUpperCase() === "APPROVE") {
      const amountToPay = part.estimatedCost;

      // Handle Wallet Payment if selected
      if (paymentMethod === "WALLET") {
        const userWallet = await prisma.wallet.findUnique({
          where: { userId: part.customerId },
        });

        if (!userWallet || userWallet.balance < amountToPay) {
          return NextResponse.json(
            {
              error: `Insufficient wallet balance. You need ₦${amountToPay.toLocaleString()} but your wallet balance is ₦${(userWallet?.balance || 0).toLocaleString()}. Please top up your wallet or pay via Paystack.`,
            },
            { status: 400 }
          );
        }

        // Debit customer wallet
        await prisma.wallet.update({
          where: { id: userWallet.id },
          data: { balance: { decrement: amountToPay } },
        });

        await prisma.walletTransaction.create({
          data: {
            walletId: userWallet.id,
            type: "DEBIT",
            amount: amountToPay,
            description: `Part Procurement Escrow: ${part.partName} (#${part.reference})`,
            reference: `WALLET-PART-${part.reference}-${Date.now()}`,
            gateway: "WALLET",
          },
        });
      }

      // Record platform payment in HandyHub Escrow
      const effectivePaymentRef =
        paymentReference || `PAY-PART-${part.reference}-${Date.now()}`;

      await prisma.payment.create({
        data: {
          bookingId: part.bookingId,
          userId: part.customerId,
          amount: amountToPay,
          currency: "NGN",
          provider: paymentMethod === "WALLET" ? "WALLET" : "PAYSTACK",
          reference: effectivePaymentRef,
          status: "SUCCESS",
          metadata: JSON.stringify({
            type: "REPLACEMENT_PART_PROCUREMENT",
            partId: part.id,
            partRef: part.reference,
            partName: part.partName,
          }),
        },
      });

      // Ensure a verified supplier is linked
      let supplier = part.supplier;
      if (!supplier) {
        supplier = await findSupplierForCategory(part.category);
      }

      // Generate single-use cryptographic voucher
      const voucherCode = generateVoucherCode();
      const voucherExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours validity

      const updatedPart = await prisma.replacementPart.update({
        where: { id: partId },
        data: {
          status: "VOUCHER_ISSUED",
          approvedCost: amountToPay,
          paymentStatus: "PAID_ESCROW",
          paymentMethod,
          paymentReference: effectivePaymentRef,
          supplierId: supplier?.id || null,
          voucherCode,
          voucherExpiresAt,
        },
        include: {
          supplier: true,
          booking: { include: { service: true } },
          professional: { include: { user: true } },
        },
      });

      // Immutable Audit Logs
      await logPartAudit({
        partId: part.id,
        actorId: part.customerId,
        actorRole: "CUSTOMER",
        action: "APPROVED",
        notes: `Customer approved replacement part for ₦${amountToPay.toLocaleString()} via ${paymentMethod}.`,
        metadata: { amount: amountToPay, paymentMethod, paymentReference: effectivePaymentRef },
      });

      await logPartAudit({
        partId: part.id,
        actorRole: "SYSTEM",
        action: "VOUCHER_ISSUED",
        notes: `Issued one-time procurement voucher ${voucherCode} for supplier ${supplier?.name || "Verified Partner"}.`,
        metadata: { voucherCode, expiresAt: voucherExpiresAt },
      });

      // Notify Artisan with Purchase Voucher on In-App & WhatsApp
      const proPhone = part.professional?.user?.phone;
      const proName = part.professional?.user
        ? `${part.professional.user.firstName} ${part.professional.user.lastName}`
        : "Artisan";
      const supplierName = supplier?.name || "HandyHub Verified Partner Hub";
      const supplierAddress = supplier?.address || "Central Commercial District, Abuja";

      if (part.professional?.user?.id) {
        await sendMultiChannelNotification({
          userId: part.professional.user.id,
          type: "BOOKING",
          title: "🎟️ Part Approved! One-Time Purchase Voucher Ready",
          message: `The client has authorized payment for ${part.partName} (₦${amountToPay.toLocaleString()}). Use Voucher Code [ ${voucherCode} ] at ${supplierName} (${supplierAddress}) to collect part.`,
          bookingRef: part.booking.reference,
          metadata: {
            partId: part.id,
            voucherCode,
            supplierName,
            supplierAddress,
          },
        });
      }

      if (proPhone) {
        await sendArtisanPartVoucherAlert({
          artisanPhone: proPhone,
          artisanName: proName,
          bookingRef: part.booking.reference,
          partName: part.partName,
          approvedCost: amountToPay,
          voucherCode,
          supplierName,
          supplierAddress,
        }).catch((e) => console.warn("[WhatsApp Pro Voucher Alert Warning]", e));
      }

      return NextResponse.json({
        success: true,
        message: "Replacement part authorized and one-time procurement voucher issued.",
        part: updatedPart,
      });
    }

    return NextResponse.json({ error: "Invalid action. Must be APPROVE or REJECT." }, { status: 400 });
  } catch (err: any) {
    console.error("[Part Authorize POST Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to process replacement part authorization." },
      { status: 500 }
    );
  }
}
