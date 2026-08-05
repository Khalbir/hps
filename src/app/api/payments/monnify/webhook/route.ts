import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMultiChannelNotification, formatNaira } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, eventData } = body;

    if (eventType === "SUCCESSFUL_TRANSACTION" && eventData) {
      const { paymentReference, amountPaid, customer } = eventData;

      // Find booking or payment record
      const payment = await prisma.payment.findUnique({
        where: { reference: paymentReference },
        include: { booking: { include: { customer: true } } },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCESS", provider: "MONNIFY" },
        });

        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { paymentStatus: "PAID", status: "ACCEPTED" },
        });

        // Notify customer
        if (payment.booking.customer) {
          await sendMultiChannelNotification({
            userId: payment.userId,
            recipientEmail: payment.booking.customer.email,
            recipientPhone: payment.booking.customer.phone || undefined,
            recipientName: `${payment.booking.customer.firstName} ${payment.booking.customer.lastName}`,
            type: "PAYMENT",
            title: "Monnify Payment Successful",
            message: `Your payment of ${formatNaira(amountPaid)} for Booking #${payment.booking.reference} via Monnify was successful.`,
          });
        }
      }
    }

    return NextResponse.json({ responseCode: "0", responseMessage: "Monnify webhook processed" });
  } catch (error) {
    console.error("[Monnify Webhook Error]:", error);
    return NextResponse.json({ error: "Failed to process Monnify webhook" }, { status: 500 });
  }
}
