import { NextRequest, NextResponse } from "next/server";
import { verifyOrderDeliveryOtp } from "@/lib/logistics";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { otp, customerId } = body;

    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit delivery OTP code." },
        { status: 400 }
      );
    }

    const res = await verifyOrderDeliveryOtp({
      orderId: id,
      submittedOtp: otp.trim(),
      actorId: customerId,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Delivery confirmed successfully! Merchant payout released from Procurement Account.",
      order: res.order,
    });
  } catch (error: any) {
    console.error("[Marketplace Confirm Delivery POST Error]:", error);
    return NextResponse.json({ error: "Failed to confirm delivery" }, { status: 500 });
  }
}
