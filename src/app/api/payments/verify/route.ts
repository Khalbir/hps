import { NextResponse } from "next/server";
import { verifyPaystackPayment, calculateEscrowCommission } from "@/lib/fintech";

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
    }

    // Verify status against Gateway API
    const verification = await verifyPaystackPayment(reference);

    if (verification.status !== "SUCCESS") {
      return NextResponse.json(
        { error: "Payment verification failed or pending" },
        { status: 400 }
      );
    }

    // Calculate 15% platform cut vs 85% pro earnings
    const escrowBreakdown = calculateEscrowCommission(verification.amountNgn);

    return NextResponse.json({
      success: true,
      verification,
      escrowBreakdown,
      unlockedContactDetails: true,
      message: "Payment verified successfully. Contact details unlocked & funds allocated to 24-hour escrow hold pool.",
    });
  } catch (error) {
    console.error("[Payment Verify REST API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error verifying payment" },
      { status: 500 }
    );
  }
}
