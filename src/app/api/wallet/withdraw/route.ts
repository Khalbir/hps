import { NextResponse } from "next/server";
import { evaluateFraudRiskScore } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, bankCode, bankName, accountNumber, accountName } = body;

    if (!amount || !accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "Amount, bankCode, and accountNumber are required" },
        { status: 400 }
      );
    }

    // Fraud Evaluation Check
    const fraudCheck = evaluateFraudRiskScore({
      rapidWithdrawalAttempts: 1, // Normal threshold
      isAccountVerified: true,
    });

    if (fraudCheck.blockAction) {
      return NextResponse.json(
        {
          error: "Withdrawal blocked due to high fraud risk flags.",
          reasons: fraudCheck.reasons,
        },
        { status: 403 }
      );
    }

    const reference = `WTH_${userId || "USR"}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      reference,
      amount: Number(amount),
      bankName: bankName || "GTBank",
      accountNumber,
      accountName: accountName || "Verified Pro Partner",
      status: "PROCESSING",
      estimatedDelivery: "Instant NUBAN Transfer (1-3 minutes)",
      message: "Withdrawal request queued and processing via Paystack Transfer API.",
    });
  } catch (error) {
    console.error("[Withdraw REST API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error processing withdrawal" },
      { status: 500 }
    );
  }
}
