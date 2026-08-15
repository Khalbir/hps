import { NextResponse } from "next/server";
import { verifyAndRecordPayment, calculateEscrowCommission } from "@/lib/fintech";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    const provider = searchParams.get("provider") || "PAYSTACK";

    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";

    if (!reference) {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed&reason=no_reference`);
    }

    // Handle Top-Up verification
    if (reference.startsWith("TOPUP-")) {
      const payment = await prisma.payment.findUnique({ where: { reference } });
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

        return NextResponse.redirect(`${baseUrl}/dashboard?payment=success&topup=SUCCESS&amount=${payment.amount}&reference=${reference}`);
      }
    }

    const verification = await verifyAndRecordPayment(reference, provider);
    if (verification.status === "SUCCESS") {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=success&amount=${verification.amountNgn}&reference=${reference}`);
    } else {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed&reference=${reference}`);
    }
  } catch (error) {
    console.error("[Payment Verify GET API Error]:", error);
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=error`);
  }
}

export async function POST(request: Request) {
  try {
    const { reference, provider } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
    }

    const verification = await verifyAndRecordPayment(reference, provider);

    if (verification.status !== "SUCCESS") {
      return NextResponse.json(
        { error: "Payment verification failed or pending", verification },
        { status: 400 }
      );
    }

    const escrowBreakdown = calculateEscrowCommission(verification.amountNgn);

    return NextResponse.json({
      success: true,
      verification,
      escrowBreakdown,
      unlockedContactDetails: true,
      message: "Payment verified successfully. Booking confirmed and notifications sent to customer and professional.",
    });
  } catch (error) {
    console.error("[Payment Verify REST API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error verifying payment" },
      { status: 500 }
    );
  }
}
