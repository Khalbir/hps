import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paystack } from "@/lib/paystack";
import { verifyAndRecordPayment } from "@/lib/fintech";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference") || searchParams.get("ref") || searchParams.get("bookingRef");
    const autoVerify = searchParams.get("verify") === "true";

    if (!reference) {
      return NextResponse.json({ error: "Reference parameter is required" }, { status: 400 });
    }

    const cleanRef = reference.trim();

    // 1. Look up Payment by reference OR by booking reference / ID
    let payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { reference: cleanRef },
          { booking: { reference: cleanRef } },
          { bookingId: cleanRef },
        ],
      },
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
            professional: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          },
        },
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    // 2. If payment is PENDING and autoVerify is requested or status check triggers, check Paystack live
    if (payment && payment.status === "PENDING" && autoVerify) {
      const verifyResult = await verifyAndRecordPayment(payment.reference, "PAYSTACK");
      if (verifyResult.status === "SUCCESS") {
        payment = await prisma.payment.findUnique({
          where: { id: payment.id },
          include: {
            booking: {
              include: {
                service: true,
                customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
                professional: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
              },
            },
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        });
      }
    }

    // 3. If no payment record found directly, search Booking table
    if (!payment) {
      const booking = await prisma.booking.findFirst({
        where: {
          OR: [
            { reference: cleanRef },
            { id: cleanRef },
          ],
        },
        include: {
          service: true,
          customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
          professional: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: `No payment or booking record found for reference "${cleanRef}"` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        isBookingOnly: true,
        reference: booking.reference,
        bookingId: booking.id,
        amount: booking.finalPrice || booking.estimatedPrice,
        currency: "NGN",
        paymentStatus: booking.paymentStatus,
        serviceName: booking.service.name,
        customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
        customerEmail: booking.customer.email,
        scheduledDate: booking.scheduledDate,
        createdAt: booking.createdAt,
      });
    }

    let parsedMeta: any = {};
    try {
      parsedMeta = JSON.parse(payment.metadata || "{}");
    } catch {}

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        provider: payment.provider,
        status: payment.status,
        channel: parsedMeta.channel || "card",
        cardType: parsedMeta.cardType,
        last4: parsedMeta.last4,
        bank: parsedMeta.bank,
        authorizationCode: parsedMeta.authorizationCode,
        createdAt: payment.createdAt,
        paidAt: parsedMeta.paidAt || payment.createdAt,
      },
      booking: payment.booking ? {
        id: payment.booking.id,
        reference: payment.booking.reference,
        serviceName: payment.booking.service.name,
        serviceCategory: payment.booking.service.categoryId,
        status: payment.booking.status,
        paymentStatus: payment.booking.paymentStatus,
        paymentMethod: payment.booking.paymentMethod,
        address: payment.booking.address,
        scheduledDate: payment.booking.scheduledDate,
        scheduledTime: payment.booking.scheduledTime,
      } : null,
      customer: payment.user || payment.booking?.customer || null,
    });
  } catch (error: any) {
    console.error("[Payment Status API Error]:", error);
    return NextResponse.json(
      { error: "Failed to retrieve payment status: " + error.message },
      { status: 500 }
    );
  }
}
