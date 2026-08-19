import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsAppAlert, formatNigerianPhone } from "@/lib/whatsapp";
import { notifyBookingStatusChange } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Meta Cloud API Webhook Verification (GET)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "handyhub_webhook_secret";

    if (mode === "subscribe" && token === expectedToken) {
      console.log("[WhatsApp Webhook Verified Successfully]");
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  } catch (error) {
    console.error("[WhatsApp Webhook GET Error]:", error);
    return new Response("Error", { status: 500 });
  }
}

/**
 * Incoming WhatsApp Message & Status Callback Handler (POST)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Parse Meta Cloud API payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    // 2. Parse Termii or generic payload if not Meta
    const senderPhone = message?.from || body.from || body.phone || "";
    const messageText = (
      message?.text?.body ||
      message?.button?.text ||
      message?.interactive?.button_reply?.title ||
      body.message ||
      body.sms ||
      ""
    ).trim();

    if (!senderPhone || !messageText) {
      return NextResponse.json({ success: true, note: "No actionable message body" });
    }

    const formattedPhone = formatNigerianPhone(senderPhone);
    const upperText = messageText.toUpperCase();

    console.log(`[Incoming WhatsApp from +${formattedPhone}]: "${messageText}"`);

    // Find User by Phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: formattedPhone },
          { phone: `+${formattedPhone}` },
          { phone: `0${formattedPhone.substring(3)}` },
        ],
      },
      include: { professional: true },
    });

    // -------------------------------------------------------------
    // COMMAND 1: ARTISAN ACCEPTS JOB ("ACCEPT <REF>" or "ACCEPT")
    // -------------------------------------------------------------
    if (upperText.startsWith("ACCEPT") || upperText.startsWith("CLAIM")) {
      const parts = upperText.split(/\s+/);
      const bookingRefQuery = parts[1] || "";

      if (user?.professional && user.professional.verificationStatus === "VERIFIED") {
        // Find targeted or earliest open booking
        let booking = null;
        if (bookingRefQuery) {
          booking = await prisma.booking.findFirst({
            where: {
              reference: { contains: bookingRefQuery.replace("#", "") },
              status: { in: ["PENDING", "ASSIGNED"] },
            },
            include: { customer: true, service: true },
          });
        } else {
          booking = await prisma.booking.findFirst({
            where: {
              status: "PENDING",
              professionalId: null,
            },
            orderBy: { createdAt: "desc" },
            include: { customer: true, service: true },
          });
        }

        if (booking) {
          // Assign pro to booking
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              professionalId: user.professional.id,
              status: "ASSIGNED",
            },
          });

          // Confirm to Artisan on WhatsApp
          await sendWhatsAppAlert({
            recipientPhone: formattedPhone,
            recipientName: `${user.firstName} ${user.lastName}`.trim(),
            title: "Job Accepted Successfully! ✅",
            body: `You have successfully accepted Booking #${booking.reference} for ${booking.service?.name || "Service"}.\n\nClient Location: ${booking.address || "Abuja FCT"}\n\nPlease proceed to your jobs dashboard to update status to EN ROUTE when you depart.`,
            bookingRef: booking.reference,
            actionUrl: "https://handyhubpro.ng/pro/jobs",
            actionLabel: "Open Pro Jobs Dashboard",
          });

          // Notify Client
          await notifyBookingStatusChange({
            id: booking.id,
            reference: booking.reference,
            status: "ASSIGNED",
            customerId: booking.customerId,
            customer: booking.customer,
            professional: {
              ...user.professional,
              user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
              },
            },
            service: booking.service,
            estimatedPrice: booking.estimatedPrice,
            address: booking.address || undefined,
          });

          return NextResponse.json({ success: true, action: "JOB_ACCEPTED", reference: booking.reference });
        } else {
          await sendWhatsAppAlert({
            recipientPhone: formattedPhone,
            recipientName: user.firstName,
            title: "Job Notice",
            body: "The requested job is no longer available or has already been assigned to another artisan partner.",
            actionUrl: "https://handyhubpro.ng/pro/jobs",
            actionLabel: "View Available Jobs",
          });
          return NextResponse.json({ success: true, note: "Job not available" });
        }
      }
    }

    // -------------------------------------------------------------
    // COMMAND 2: STATUS LOOKUP ("STATUS" or "TRACK")
    // -------------------------------------------------------------
    if (upperText === "STATUS" || upperText.startsWith("STATUS") || upperText === "TRACK") {
      if (user) {
        const latestBooking = await prisma.booking.findFirst({
          where: {
            OR: [
              { customerId: user.id },
              { professionalId: user.professional?.id || "none" },
            ],
          },
          orderBy: { createdAt: "desc" },
          include: { service: true, professional: { include: { user: true } } },
        });

        if (latestBooking) {
          const isArtisan = user.role === "ARTISAN" || !!user.professional;
          const statusText = latestBooking.status.replace(/_/g, " ");

          await sendWhatsAppAlert({
            recipientPhone: formattedPhone,
            recipientName: user.firstName,
            title: `Booking #${latestBooking.reference} Status`,
            body: `Your latest booking for *${latestBooking.service?.name}* is currently: *${statusText}*.\n\nEscrow Status: Protected 🛡️`,
            bookingRef: latestBooking.reference,
            actionUrl: isArtisan ? "https://handyhubpro.ng/pro/jobs" : `https://handyhubpro.ng/track?ref=${encodeURIComponent(latestBooking.reference)}`,
            actionLabel: isArtisan ? "Open Pro Dashboard" : "View Live Radar Tracker",
          });

          return NextResponse.json({ success: true, action: "STATUS_SENT" });
        }
      }
    }

    // -------------------------------------------------------------
    // COMMAND 3: GENERAL HELP & CUSTOMER CONCIERGE
    // -------------------------------------------------------------
    const helpGreeting =
      `Hello ${user?.firstName || "there"}! Welcome to HandyHub Pro Automated WhatsApp Concierge.\n\n` +
      `Here are quick commands you can send:\n` +
      `• Reply *STATUS* to check your latest booking progress.\n` +
      `• Reply *ACCEPT <REF>* to claim a job (Artisans).\n` +
      `• Reply *HELP* to speak with a human support agent.\n\n` +
      `You can also track any active booking online:`;

    await sendWhatsAppAlert({
      recipientPhone: formattedPhone,
      recipientName: user?.firstName || "Valued User",
      title: "HandyHub Pro Concierge 🤖",
      body: helpGreeting,
      actionUrl: "https://handyhubpro.ng",
      actionLabel: "Visit HandyHub Pro",
    });

    return NextResponse.json({ success: true, action: "HELP_SENT" });
  } catch (error: any) {
    console.error("[WhatsApp Webhook POST Error]:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
