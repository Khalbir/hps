import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { purgeDemoRecordsFromDB, DEMO_EMAILS, DEMO_PAYMENT_REFS } from "@/lib/purge-demo-utility";
import { verifyAndRecordPayment } from "@/lib/fintech";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Automatically purge pre-seeded demo records from database on fetch
    await purgeDemoRecordsFromDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");

    // 1. Fetch raw payments from Payment table
    const where: any = {
      user: {
        email: { notIn: DEMO_EMAILS },
      },
      reference: { notIn: DEMO_PAYMENT_REFS },
    };
    if (status && status !== "ALL") where.status = status;
    if (provider && provider !== "ALL") where.provider = provider;

    const rawPayments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        booking: {
          select: {
            id: true,
            reference: true,
            status: true,
            service: { select: { name: true } },
          },
        },
      },
    });

    // 2. Fetch paid bookings from Booking table to ensure complete coverage
    const rawPaidBookings = await prisma.booking.findMany({
      where: {
        paymentStatus: { in: ["PAID", "HELD_IN_ESCROW", "RELEASED", "REFUNDED"] },
        customer: { email: { notIn: DEMO_EMAILS } },
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        service: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const paymentRefsSet = new Set(rawPayments.map((p) => p.reference));

    // Convert paid bookings without duplicate payment records into payment format
    const bookingPayments = rawPaidBookings
      .filter((b) => !paymentRefsSet.has(`PAY_${b.reference}`) && !paymentRefsSet.has(b.reference))
      .map((b) => ({
        id: `pay_bkg_${b.id}`,
        reference: `PAY_${b.reference}`,
        bookingId: b.id,
        booking: { id: b.id, reference: b.reference, status: b.status, service: b.service },
        amount: b.estimatedPrice,
        currency: "NGN",
        provider: b.paymentMethod ? b.paymentMethod.toUpperCase() : "PAYSTACK",
        status: b.paymentStatus === "REFUNDED" ? "REFUNDED" : "SUCCESS",
        metadata: "{}",
        user: b.customer,
        createdAt: b.createdAt,
      }));

    // Combine all payments
    const allPaymentsCombined = [...rawPayments, ...bookingPayments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const filteredPayments = allPaymentsCombined.filter(
      (p) => !p.user || !DEMO_EMAILS.includes(p.user.email)
    );

    const successPayments = filteredPayments.filter((p) => p.status === "SUCCESS");
    const totalSuccessNgn = successPayments.reduce((acc, curr) => acc + curr.amount, 0);

    const paystackSuccessPayments = successPayments.filter(
      (p) => p.provider === "PAYSTACK" || p.provider === "PAYSTACK_LIVE"
    );
    const paystackVolumeNgn = paystackSuccessPayments.reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      success: true,
      payments: filteredPayments,
      stats: {
        totalSuccessNgn,
        paystackVolumeNgn: paystackVolumeNgn || totalSuccessNgn,
        platformFeeNgn: Math.round(totalSuccessNgn * 0.20),
        failedCount: filteredPayments.filter((p) => p.status === "FAILED").length,
        totalCount: filteredPayments.length,
      },
    });
  } catch (error: any) {
    console.error("[Payments GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch payments: " + error.message }, { status: 500 });
  }
}

/**
 * POST handler for Admin Manual Payment Verification & Reconciliation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, provider } = body;

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
    }

    const verification = await verifyAndRecordPayment(reference, provider || "PAYSTACK");

    return NextResponse.json({
      success: true,
      verification,
      message: `Transaction ${reference} verification processed. Result: ${verification.status}`,
    });
  } catch (error: any) {
    console.error("[Admin Payment POST Error]:", error);
    return NextResponse.json({ error: "Manual verification error: " + error.message }, { status: 500 });
  }
}
