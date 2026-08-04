import { NextResponse } from "next/server";
import { initializeDualGatewayCheckout } from "@/lib/fintech";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amountNgn, bookingId, customerName, customerPhone } = body;

    if (!email || !amountNgn) {
      return NextResponse.json(
        { error: "Email and amountNgn are required" },
        { status: 400 }
      );
    }

    const reference = `HHP_${bookingId || "BKG"}_${Date.now()}`;
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/$/, "") || "http://localhost:3000";
    const callbackUrl = `${origin}/book?status=success`;

    // Dual-gateway checkout router (Paystack primary -> Flutterwave failover)
    const checkout = await initializeDualGatewayCheckout({
      email,
      amountNgn: Number(amountNgn),
      reference,
      callbackUrl,
      customerName,
      customerPhone,
      metadata: { bookingId, email },
    });

    return NextResponse.json({
      success: true,
      checkout,
      message: checkout.isFallback
        ? "Payment route initialized via Failover Gateway (Flutterwave)"
        : "Payment route initialized via Primary Gateway (Paystack)",
    });
  } catch (error) {
    console.error("[Payment Init REST API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error initializing payment" },
      { status: 500 }
    );
  }
}
