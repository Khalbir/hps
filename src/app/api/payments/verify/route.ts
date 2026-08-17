import { NextResponse } from "next/server";
import { verifyAndRecordPayment, calculateEscrowCommission } from "@/lib/fintech";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    const provider = searchParams.get("provider") || "PAYSTACK";

    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/$/, "") || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";

    if (!reference) {
      return NextResponse.redirect(`${origin}/dashboard?payment=failed&reason=no_reference`);
    }

    // Handle Top-Up verification
    if (reference.includes("TOPUP")) {
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [{ reference }, { bookingId: reference }],
        },
      });

      if (payment && payment.userId) {
        await prisma.wallet.upsert({
          where: { userId: payment.userId },
          create: { userId: payment.userId, balance: payment.amount, pendingEscrow: 0 },
          update: { balance: { increment: payment.amount } },
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCESS" },
        });

        return NextResponse.redirect(`${origin}/dashboard/wallet?status=success&topup=SUCCESS&amount=${payment.amount}&reference=${reference}`);
      }
    }

    const verification = await verifyAndRecordPayment(reference, provider);
    if (verification.status === "SUCCESS") {
      return NextResponse.redirect(`${origin}/receipt/${encodeURIComponent(reference)}?status=success&amount=${verification.amountNgn}`);
    } else {
      return NextResponse.redirect(`${origin}/receipt/${encodeURIComponent(reference)}?status=failed&reason=verification_failed`);
    }
  } catch (error) {
    console.error("[Payment Verify GET API Error]:", error);
    const origin = request.headers.get("origin") || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";
    return NextResponse.redirect(`${origin}/dashboard?payment=error`);
  }
}

export async function POST(request: Request) {
  try {
    const { reference, provider } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
    }

    const verification = await verifyAndRecordPayment(reference, provider || "PAYSTACK");

    if (verification.status !== "SUCCESS") {
      return NextResponse.json(
        { error: "Payment verification failed or pending", verification },
        { status: 400 }
      );
    }

    const escrowBreakdown = calculateEscrowCommission(verification.amountNgn);

    const paymentRecord = await prisma.payment.findUnique({
      where: { reference },
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      verification,
      payment: paymentRecord,
      escrowBreakdown,
      unlockedContactDetails: true,
      message: "Payment verified successfully. Booking confirmed and digital receipt available.",
    });
  } catch (error: any) {
    console.error("[Payment Verify REST API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error verifying payment: " + (error.message || "") },
      { status: 500 }
    );
  }
}
