import { NextResponse } from "next/server";
import { verifyPaystackSignature, verifyAndRecordPayment } from "@/lib/fintech";
import { prisma } from "@/lib/db";
import { sendMultiChannelNotification, formatNaira } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const paystackSignature = request.headers.get("x-paystack-signature");

    // 1. Verify HMAC SHA512 signature securely using environment variables
    const isValidSignature = verifyPaystackSignature(rawBody, paystackSignature);

    if (!isValidSignature && process.env.NODE_ENV === "production") {
      console.error("[Paystack Webhook] Invalid HMAC SHA512 Signature");
      return NextResponse.json({ error: "Invalid Paystack signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody || "{}");
    const eventType = event.event;
    const data = event.data || {};

    console.log(`[Paystack Webhook Received] Event: ${eventType}, Ref: ${data.reference}`);

    // 2. Handle Event Callbacks
    switch (eventType) {
      case "charge.success": {
        const reference = data.reference;
        const amountNgn = (data.amount || 0) / 100;

        // Update DB payment record & trigger notifications
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
            data: { status: "FAILED" },
          });

          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { paymentStatus: "FAILED" },
          });
        }
        console.warn(`[Paystack Webhook] Charge failed for ref: ${reference}`);
        break;
      }

      case "transfer.success": {
        console.log(`[Paystack Webhook] Transfer success for ref: ${data.reference}`);
        break;
      }

      case "transfer.failed": {
        console.warn(`[Paystack Webhook] Transfer failed for ref: ${data.reference}`);
        break;
      }

      default:
        console.log(`[Paystack Webhook] Event ignored: ${eventType}`);
    }

    return NextResponse.json({ status: "success", received: true });
  } catch (error: any) {
    console.error("[Paystack Webhook Processing Error]:", error);
    return NextResponse.json({ error: "Webhook process error", details: error.message }, { status: 500 });
  }
}
