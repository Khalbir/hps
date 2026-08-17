import { NextResponse } from "next/server";
import { paystack } from "@/lib/paystack";
import { verifyAndRecordPayment } from "@/lib/fintech";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const paystackSignature = request.headers.get("x-paystack-signature");

    // 1. Verify HMAC SHA512 signature securely
    const isValidSignature = paystack.verifyWebhookSignature(rawBody, paystackSignature);

    if (!isValidSignature && process.env.NODE_ENV === "production") {
      console.error("[Paystack Webhook] Invalid HMAC SHA512 Signature rejected");
      return NextResponse.json({ error: "Invalid Paystack signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody || "{}");
    const eventType = event.event;
    const data = event.data || {};

    console.log(`[Paystack Webhook Received] Event: ${eventType}, Reference: ${data.reference}`);

    // 2. Handle Event Callbacks Idempotently
    switch (eventType) {
      case "charge.success": {
        const reference = data.reference;

        // Verify and record payment idempotently
        await verifyAndRecordPayment(reference, "PAYSTACK");

        console.log(`[Paystack Webhook] Successfully processed charge.success for ref: ${reference}`);
        break;
      }

      case "charge.failed": {
        const reference = data.reference;
        const payment = await prisma.payment.findUnique({ where: { reference } });
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              metadata: JSON.stringify({
                gateway_response: data.gateway_response,
                message: data.message,
                channel: data.channel,
              }),
            },
          });

          if (payment.bookingId) {
            await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { paymentStatus: "FAILED" },
            }).catch(() => {});
          }
        }
        console.warn(`[Paystack Webhook] Charge marked FAILED for ref: ${reference}`);
        break;
      }

      default:
        console.log(`[Paystack Webhook] Unhandled event type: ${eventType} (Acknowledged)`);
    }

    // Always return 200 OK fast so Paystack does not retry
    return NextResponse.json({ status: "success", received: true });
  } catch (error: any) {
    console.error("[Paystack Webhook Processing Error]:", error);
    return NextResponse.json({ error: "Webhook processing error", details: error.message }, { status: 500 });
  }
}
