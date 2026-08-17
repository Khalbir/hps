import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference") || searchParams.get("ref");

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    const cleanRef = reference.trim();

    // 1. Search for payment record
    let payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { reference: cleanRef },
          { booking: { reference: cleanRef } },
          { bookingId: cleanRef },
        ],
      },
      include: {
        booking: {
          include: {
            service: true,
            customer: true,
            professional: { include: { user: true } },
          },
        },
        user: true,
      },
    });

    // 2. If not found in payment table, check booking table
    let booking: any = payment?.booking;
    if (!booking) {
      booking = await prisma.booking.findFirst({
        where: {
          OR: [{ reference: cleanRef }, { id: cleanRef }],
        },
        include: {
          service: true,
          customer: true,
          professional: { include: { user: true } },
        },
      });
    }

    if (!payment && !booking) {
      return NextResponse.json(
        { error: `No transaction found for reference "${cleanRef}"` },
        { status: 404 }
      );
    }

    let parsedMeta: any = {};
    if (payment?.metadata) {
      try {
        parsedMeta = JSON.parse(payment.metadata);
      } catch {}
    }

    const customer = payment?.user || booking?.customer;
    const amountNgn = payment?.amount || booking?.finalPrice || booking?.estimatedPrice || 0;
    const serviceName = booking?.service?.name || "HandyHub Pro Verified Service";
    const paymentStatus = payment?.status || (booking?.paymentStatus === "PAID" ? "SUCCESS" : booking?.paymentStatus || "PENDING");
    const receiptNumber = `HHP-REC-${(payment?.reference || booking?.reference || cleanRef).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;

    const receipt = {
      receiptNumber,
      transactionReference: payment?.reference || booking?.reference || cleanRef,
      gateway: payment?.provider || "PAYSTACK",
      gatewayReference: payment?.reference || cleanRef,
      channel: parsedMeta.channel || "card",
      cardType: parsedMeta.cardType || "Debit Card",
      last4: parsedMeta.last4 || "••••",
      bank: parsedMeta.bank || "Verified Bank",
      authorizationCode: parsedMeta.authorizationCode || null,
      status: paymentStatus,
      isPaid: paymentStatus === "SUCCESS" || booking?.paymentStatus === "PAID",
      amountNgn,
      formattedAmount: formatNaira(amountNgn),
      currency: "NGN",
      taxNgn: 0,
      discountNgn: booking?.discountAmount || 0,
      totalPaidNgn: amountNgn,
      formattedTotalPaid: formatNaira(amountNgn),
      paymentDate: payment?.createdAt ? new Date(payment.createdAt).toISOString() : new Date().toISOString(),
      customer: {
        name: customer ? `${customer.firstName} ${customer.lastName}` : "Valued Customer",
        email: customer?.email || "customer@handyhubpro.ng",
        phone: customer?.phone || "+234 812 222 2936",
      },
      service: {
        name: serviceName,
        bookingRef: booking?.reference || "N/A",
        scheduledDate: booking?.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "Scheduled",
        scheduledTime: booking?.scheduledTime || "Flexible",
        serviceAddress: booking?.address || "Abuja, FCT, Nigeria",
      },
      merchant: {
        name: "HandyHub Pro Solutions Limited",
        registrationNumber: "RC-789210",
        address: "Federal Capital Territory, Abuja, Nigeria",
        email: "support@handyhubpro.ng",
        phone: "+234 812 222 2936",
        website: "https://handyhubpro.ng",
      },
      escrowGuarantee: {
        isEscrowProtected: true,
        warrantyPeriodDays: 14,
        policy: "Funds held safely in escrow until service delivery is completed and confirmed via customer OTP.",
      },
    };

    return NextResponse.json({
      success: true,
      receipt,
    });
  } catch (error: any) {
    console.error("[Digital Receipt API Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt: " + error.message },
      { status: 500 }
    );
  }
}
