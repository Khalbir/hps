import { NextResponse } from "next/server";
import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "sk_test_handyhub_paystack_mock";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const paystackSignature = request.headers.get("x-paystack-signature");

    // Verify HMAC SHA512 signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (paystackSignature !== hash && process.env.NODE_ENV === "production") {
      console.error("[Paystack Webhook] Invalid HMAC Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody || "{}");

    // Handle Paystack Event Callbacks
    switch (event.event) {
      case "charge.success":
        console.log(`[Paystack Webhook] Successful payment for ref: ${event.data.reference}`);
        break;

      case "transfer.success":
        console.log(`[Paystack Webhook] Successful bank transfer for ref: ${event.data.reference}`);
        break;

      case "transfer.failed":
        console.warn(`[Paystack Webhook] Bank transfer failed for ref: ${event.data.reference}`);
        break;

      default:
        console.log(`[Paystack Webhook] Event received: ${event.event}`);
    }

    return NextResponse.json({ status: "success", received: true });
  } catch (error) {
    console.error("[Paystack Webhook Error]:", error);
    return NextResponse.json({ error: "Webhook process failed" }, { status: 500 });
  }
}
