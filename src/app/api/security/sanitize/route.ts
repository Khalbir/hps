import { NextResponse } from "next/server";
import { sanitizeContentForBypass, evaluateFraudRiskScore } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const { message, isPaymentConfirmed = false } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message string is required" }, { status: 400 });
    }

    const sanitized = sanitizeContentForBypass(message, isPaymentConfirmed);
    const fraudEvaluation = evaluateFraudRiskScore({
      bypassCount: sanitized.hasBypassAttempt ? 1 : 0,
      isAccountVerified: true,
    });

    return NextResponse.json({
      sanitized,
      fraudEvaluation,
      protectionStatus: sanitized.hasBypassAttempt
        ? "BYPASS_ATTEMPT_DETECTED_AND_MASKED"
        : "CLEAN",
    });
  } catch (error) {
    console.error("[Sanitize API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error sanitizing content" },
      { status: 500 }
    );
  }
}
