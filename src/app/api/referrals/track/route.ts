import { NextResponse } from "next/server";
import { trackReferralCodeClick, attributeReferral } from "@/lib/referrals/engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, code, refereeUserId, programType } = body;

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    if (action === "CLICK") {
      if (!code) {
        return NextResponse.json({ error: "Referral code required" }, { status: 400 });
      }
      const success = await trackReferralCodeClick(code, ipAddress || undefined);
      return NextResponse.json({ success });
    }

    if (action === "ATTRIBUTE") {
      if (!code || !refereeUserId) {
        return NextResponse.json({ error: "Code and refereeUserId required" }, { status: 400 });
      }
      const result = await attributeReferral({
        referrerCode: code,
        refereeUserId,
        programType,
        ipAddress,
        userAgent,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API Referrals Track Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process referral tracking." },
      { status: 500 }
    );
  }
}
