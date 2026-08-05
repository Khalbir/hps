import { NextResponse } from "next/server";
import { verifyAndRecordPayment, calculateEscrowCommission } from "@/lib/fintech";

export async function POST(request: Request) {
  try {
    const { reference, provider } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
    }

    // Verify status against Modular Gateway Strategy & Update DB + Notifications
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
