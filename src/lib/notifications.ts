import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import {
  sendWhatsAppAlert,
  sendArtisanNewJobAlert,
  sendArtisanEscrowPayoutAlert,
  sendClientBookingConfirmedAlert,
  sendClientArtisanEnRouteAlert,
  sendClientWorkInProgressAlert,
  sendClientCompletionOtpAlert,
} from "@/lib/whatsapp";
import { getBookingOtp } from "@/lib/bookingOtp";
import { formatDigitalId } from "@/lib/digitalId";

export interface NotificationPayload {
  userId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  type: "BOOKING" | "PAYMENT" | "DISPUTE" | "VERIFICATION" | "SYSTEM";
  title: string;
  message: string;
  metadata?: Record<string, any>;
  channels?: Array<"EMAIL" | "WHATSAPP" | "IN_APP">;
  bookingRef?: string;
  stageName?: string;
  artisanInfo?: {
    name: string;
    phone: string;
    trade: string;
    rating?: number;
    avatar?: string;
  };
}

/**
 * Currency Formatter for Nigerian Naira (₦)
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate Direct WhatsApp Click-to-Chat Link for Customer Support Concierge
 */
export function getWhatsAppSupportLink(bookingRef?: string, stage?: string): string {
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "2348122222936";
  const cleanPhone = supportPhone.replace(/[^0-9]/g, "");
  const text = encodeURIComponent(
    `Hello HandyHub Pro Customer Support, I am inquiring about Booking #${bookingRef || "N/A"}${stage ? ` (Current Stage: ${stage})` : ""}. Please assist me.`
  );
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

/**
 * Dispatch Multi-Channel Notifications (In-App Database + Email HTML + WhatsApp API)
 */
export async function sendMultiChannelNotification(payload: NotificationPayload) {
  const channels = payload.channels || ["IN_APP", "EMAIL", "WHATSAPP"];
  const results: Record<string, boolean> = { IN_APP: false, EMAIL: false, WHATSAPP: false };

  try {
    // 1. In-App Database Notification
    if (channels.includes("IN_APP")) {
      await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.metadata ? JSON.stringify(payload.metadata) : null,
        },
      }).catch((dbErr) => console.warn("[In-App Notification Save Warning]:", dbErr));
      results.IN_APP = true;
    }

    // 2. Email Dispatch via Nodemailer HTML Engine
    if (channels.includes("EMAIL") && payload.recipientEmail) {
      const emailSent = await sendEmailNotification({
        to: payload.recipientEmail,
        name: payload.recipientName || "Valued Customer",
        subject: `[HandyHub Pro] ${payload.title} • #${payload.bookingRef || "Update"}`,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata,
        bookingRef: payload.bookingRef,
        stageName: payload.stageName,
        artisanInfo: payload.artisanInfo,
      });
      results.EMAIL = emailSent;
    }

    // 3. WhatsApp Notification Service Dispatcher
    if (channels.includes("WHATSAPP") && payload.recipientPhone) {
      const waRes = await sendWhatsAppAlert({
        recipientPhone: payload.recipientPhone,
        recipientName: payload.recipientName || "HandyHub User",
        title: payload.title,
        body: payload.message,
        bookingRef: payload.bookingRef,
      });
      results.WHATSAPP = waRes.success;
    }
  } catch (error) {
    console.error("[Notification Dispatch Error]:", error);
  }

  return results;
}

/**
 * Send High-Conversion HTML Email with Visual Progress Tracker & Live Action Buttons
 */
async function sendEmailNotification(params: {
  to: string;
  name: string;
  subject: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  bookingRef?: string;
  stageName?: string;
  artisanInfo?: {
    name: string;
    phone: string;
    trade: string;
    rating?: number;
    avatar?: string;
  };
}): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });

  const trackingUrl = params.bookingRef
    ? `https://handyhubpro.ng/track?ref=${encodeURIComponent(params.bookingRef)}`
    : "https://handyhubpro.ng/bookings";

  const waSupportUrl = getWhatsAppSupportLink(params.bookingRef, params.stageName);

  const stageNumber =
    params.stageName === "COMPLETED" || params.stageName === "ESCROW_RELEASED"
      ? 4
      : params.stageName === "IN_PROGRESS" || params.stageName === "WORK_IN_PROGRESS"
      ? 3
      : params.stageName === "EN_ROUTE" || params.stageName === "ON_THE_WAY"
      ? 2
      : params.stageName === "ASSIGNED" || params.stageName === "CONFIRMED"
      ? 1
      : 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${params.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background-color: #1E293B; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0EA5E9, #2563EB); padding: 32px 24px; text-align: center; }
          .brand { font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px; margin-bottom: 8px; }
          .title { font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 16px; font-weight: 600; color: #F8FAFC; margin-bottom: 12px; }
          .message-box { background-color: #0F172A; border-left: 4px solid #0EA5E9; padding: 16px; border-radius: 8px; font-size: 15px; line-height: 1.6; color: #CBD5E1; margin-bottom: 24px; }
          .tracker-wrap { background-color: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
          .tracker-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #94A3B8; margin-bottom: 12px; font-weight: 700; }
          .artisan-card { background: linear-gradient(145deg, #1E293B, #0F172A); border: 1px solid #0EA5E9; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
          .artisan-title { font-size: 11px; color: #38BDF8; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
          .artisan-name { font-size: 17px; font-weight: 700; color: #F8FAFC; }
          .artisan-meta { font-size: 13px; color: #94A3B8; margin-top: 4px; }
          .cta-btn { display: block; width: 100%; box-sizing: border-box; background-color: #0EA5E9; color: #FFFFFF; text-align: center; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; margin-bottom: 12px; }
          .wa-btn { display: block; width: 100%; box-sizing: border-box; background-color: #22C55E; color: #FFFFFF; text-align: center; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; margin-bottom: 24px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          .meta-table td { padding: 8px 0; border-bottom: 1px solid #334155; font-size: 14px; }
          .meta-label { color: #94A3B8; }
          .meta-val { color: #F8FAFC; font-weight: 600; text-align: right; }
          .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #334155; line-height: 1.5; }
          .ref-tag { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 20px; font-size: 12px; color: #FFFFFF; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">HANDYHUB PRO SOLUTIONS</div>
            <h1 class="title">${params.title}</h1>
            ${params.bookingRef ? `<div class="ref-tag">Booking Reference: <strong>#${params.bookingRef}</strong></div>` : ""}
          </div>
          <div class="content">
            <div class="greeting">Hello ${params.name},</div>
            <div class="message-box">
              ${params.message}
            </div>

            <!-- Visual Live Progress Tracker -->
            <div class="tracker-wrap">
              <div class="tracker-title">Live Booking Flow Status</div>
              <div style="font-size: 12px; color: #F8FAFC; margin-bottom: 8px;">
                Stage: <span style="color: #38BDF8; font-weight: 700;">${params.stageName || "LIVE DISPATCH"}</span>
              </div>
              <div style="height: 6px; width: 100%; background: #334155; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
                <div style="height: 100%; width: ${(stageNumber / 4) * 100}%; background: #0EA5E9;"></div>
              </div>
            </div>

            ${
              params.artisanInfo
                ? `
              <div class="artisan-card">
                <div class="artisan-title">👨‍🔧 Assigned Artisan Partner</div>
                <div class="artisan-name">${params.artisanInfo.name}</div>
                <div class="artisan-meta">Trade: ${params.artisanInfo.trade} • Verified Identity Badge ✓</div>
                <div class="artisan-meta">Direct Phone: <strong>${params.artisanInfo.phone}</strong></div>
              </div>
            `
                : ""
            }

            <a href="${trackingUrl}" class="cta-btn" target="_blank">
              🗺️ Track Live Booking & GPS Radar ↗
            </a>

            <a href="${waSupportUrl}" class="wa-btn" target="_blank">
              💬 Chat Support on WhatsApp (+234 812 HANDY HUB)
            </a>

            ${
              params.metadata && Object.keys(params.metadata).length > 0
                ? `
              <table class="meta-table">
                ${Object.entries(params.metadata)
                  .map(
                    ([k, v]) => `
                  <tr>
                    <td class="meta-label">${k}:</td>
                    <td class="meta-val">${v}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
            `
                : ""
            }
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} HandyHub Pro Solutions Nigeria. Abuja Headquarters & Pan-Nigeria Expansion.<br>
            Official Support: support@handyhubpro.ng • Phone: +234 812 222 2936<br>
            Your payment is held safely in escrow until you approve the completed service.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"HandyHub Pro Support" <support@handyhubpro.ng>`,
        to: params.to,
        subject: params.subject,
        html: htmlContent,
      });
      return true;
    } else {
      console.log(`\n📧 [EMAIL NOTIFICATION] To: ${params.to} | Subject: ${params.subject}`);
      return true;
    }
  } catch (err) {
    console.error("[Email Dispatch Failed]:", err);
    return false;
  }
}

/**
 * Broadcast new open booking to verified artisans in the vicinity
 */
import {
  isArtisanQualifiedForJob,
  extractTradeSlugsFromText,
  getJobRequiredTradeSlugs,
} from "@/lib/trade-categories";

/**
 * Broadcast new open booking to verified artisans qualified strictly for the job's trade category/skillset
 */
export async function broadcastNewJobToArtisans(booking: {
  id: string;
  reference: string;
  serviceId: string;
  serviceName: string;
  serviceCategory?: string;
  estimatedPrice: number;
  scheduledDate: string | Date;
  scheduledTime?: string;
  address?: string;
  tradeCategories?: string[];  // Trade-gating: only notify pros verified for these trades
}) {
  try {
    const tradeSlugs = Array.from(
      new Set([
        ...(booking.tradeCategories || []),
        ...extractTradeSlugsFromText(booking.serviceName),
        ...extractTradeSlugsFromText(booking.serviceCategory || ""),
      ])
    ).filter(Boolean);

    if (tradeSlugs.length === 0) {
      console.warn(`[Broadcast Skipped]: No valid trade category identified for job "${booking.serviceName}".`);
      return;
    }

    // Query all verified/approved professionals
    const candidatePros = await prisma.professional.findMany({
      where: {
        verificationStatus: { in: ["VERIFIED", "APPROVED"] },
        isAvailable: true,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        tradeVerifications: { select: { tradeCategory: true, tradeName: true, status: true } },
        services: { include: { service: { include: { category: true } } } },
      },
      take: 25,
    });

    // STRICT TRADE & SKILLSET FILTERING:
    // Only include artisans who possess verified credentials or declared skills matching this job
    const qualifiedPros = candidatePros.filter((pro) =>
      isArtisanQualifiedForJob(pro, {
        serviceName: booking.serviceName,
        serviceCategory: booking.serviceCategory,
        tradeCategories: tradeSlugs,
      })
    );

    if (qualifiedPros.length === 0) {
      console.log(`[Broadcast Info]: No verified artisans found matching trade categories: [${tradeSlugs.join(", ")}] for job #${booking.reference}. Notification safely suppressed.`);
      return;
    }

    const dateStr = typeof booking.scheduledDate === "string"
      ? booking.scheduledDate
      : new Date(booking.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Broadcast only to qualified artisans (max 8 nearest/highest rated)
    const targetPros = qualifiedPros.slice(0, 8);

    for (const pro of targetPros) {
      if (pro.user?.phone) {
        await sendArtisanNewJobAlert({
          artisanPhone: pro.user.phone,
          artisanName: `${pro.user.firstName} ${pro.user.lastName}`.trim(),
          serviceName: booking.serviceName,
          location: booking.address || "Abuja FCT / Covered Area",
          priceNgn: booking.estimatedPrice,
          scheduledDate: dateStr,
          scheduledTime: booking.scheduledTime || "Flexible / As Agreed",
          bookingRef: booking.reference,
        }).catch((err) => console.warn("[Broadcast Artisan WhatsApp Error]:", err));
      }

      // Also create In-App Notification for the qualified artisan
      if (pro.user?.id) {
        await prisma.notification.create({
          data: {
            userId: pro.user.id,
            type: "BOOKING",
            title: `New Trade Job Available (${booking.serviceName}) ⚡`,
            message: `A new client booking #${booking.reference} matching your verified trade (${booking.serviceName}) in ${booking.address || "your coverage zone"} is open for dispatch.`,
            data: JSON.stringify({
              "Booking Reference": `#${booking.reference}`,
              Service: booking.serviceName,
              "Job Price": formatNaira(booking.estimatedPrice),
              "Job Action": "ACCEPT_REQUIRED",
              tradeCategories: tradeSlugs,
            }),
          },
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("[Broadcast New Job Error]:", err);
  }
}


/**
 * Dispatch Comprehensive Booking Lifecycle Stage Notifications to Client & Artisan
 */
export async function notifyBookingStatusChange(booking: {
  id: string;
  reference: string;
  status: string;
  customerId: string;
  customer?: { email: string; phone?: string | null; firstName: string; lastName: string } | null;
  professional?: {
    id?: string;
    userId?: string;
    digitalId?: string | null;
    yearsExperience?: number;
    rating?: number;
    user: { id?: string; email: string; phone?: string | null; firstName: string; lastName: string };
  } | null;
  service?: { name: string } | null;
  estimatedPrice: number;
  scheduledDate?: string | Date;
  scheduledTime?: string;
  address?: string;
  completionNote?: string | null;
}) {
  const customerName = booking.customer
    ? `${booking.customer.firstName} ${booking.customer.lastName}`.trim()
    : "Valued Customer";

  const proName = booking.professional
    ? `${booking.professional.user.firstName} ${booking.professional.user.lastName}`.trim()
    : "HandyHub Pro Verified Artisan";

  const proPhone = booking.professional?.user.phone || "+234 812 222 2936";
  const proDigitalId = formatDigitalId(booking.professional as any);
  const amountStr = formatNaira(booking.estimatedPrice);
  const serviceName = booking.service?.name || "Professional Service";
  const stage = booking.status.toUpperCase();

  const artisanInfo = booking.professional
    ? {
        name: proName,
        phone: proPhone,
        trade: serviceName,
        rating: booking.professional.rating || 4.5,
      }
    : undefined;

  const dateStr = booking.scheduledDate
    ? typeof booking.scheduledDate === "string"
      ? booking.scheduledDate
      : new Date(booking.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Scheduled Date";

  // =================================================================
  // SPECIALIZED WHATSAPP WORKFLOW DISPATCHERS
  // =================================================================

  // 1. CLIENT WHATSAPP ALERTS
  if (booking.customer?.phone) {
    const custPhone = booking.customer.phone;

    if (stage === "PENDING") {
      await sendClientBookingConfirmedAlert({
        clientPhone: custPhone,
        clientName: customerName,
        serviceName,
        bookingRef: booking.reference,
        amountNgn: booking.estimatedPrice,
        scheduledDate: dateStr,
        scheduledTime: booking.scheduledTime || "As scheduled",
        serviceAddress: booking.address || "Client Specified Location",
      }).catch((e) => console.warn("[Client WhatsApp PENDING Error]:", e));
    } else if (stage === "EN_ROUTE" || stage === "ON_THE_WAY") {
      await sendClientArtisanEnRouteAlert({
        clientPhone: custPhone,
        clientName: customerName,
        artisanName: proName,
        artisanPhone: proPhone,
        digitalId: proDigitalId,
        serviceName,
        bookingRef: booking.reference,
        etaMinutes: 25,
      }).catch((e) => console.warn("[Client WhatsApp EN_ROUTE Error]:", e));
    } else if (stage === "WORK_IN_PROGRESS" || stage === "IN_PROGRESS") {
      await sendClientWorkInProgressAlert({
        clientPhone: custPhone,
        clientName: customerName,
        artisanName: proName,
        serviceName,
        bookingRef: booking.reference,
      }).catch((e) => console.warn("[Client WhatsApp WORK_IN_PROGRESS Error]:", e));
    } else if (stage === "COMPLETED") {
      const otpCode = getBookingOtp(booking);
      await sendClientCompletionOtpAlert({
        clientPhone: custPhone,
        clientName: customerName,
        artisanName: proName,
        serviceName,
        bookingRef: booking.reference,
        otpCode,
      }).catch((e) => console.warn("[Client WhatsApp COMPLETED Error]:", e));
    }
  }

  // 2. ARTISAN WHATSAPP ALERTS
  if (booking.professional?.user?.phone) {
    const artisanPhone = booking.professional.user.phone;

    if (stage === "ASSIGNED" || stage === "CONFIRMED") {
      await sendArtisanNewJobAlert({
        artisanPhone,
        artisanName: proName,
        serviceName,
        location: booking.address || "Abuja FCT / Covered Area",
        priceNgn: booking.estimatedPrice,
        scheduledDate: dateStr,
        scheduledTime: booking.scheduledTime || "As Agreed",
        bookingRef: booking.reference,
      }).catch((e) => console.warn("[Artisan WhatsApp ASSIGNED Error]:", e));
    } else if (stage === "ESCROW_RELEASED") {
      await sendArtisanEscrowPayoutAlert({
        artisanPhone,
        artisanName: proName,
        bookingRef: booking.reference,
        serviceName,
        amountNgn: booking.estimatedPrice,
      }).catch((e) => console.warn("[Artisan WhatsApp ESCROW_RELEASED Error]:", e));
    }
  }

  // =================================================================
  // IN-APP & EMAIL LIFECYCLE FALLBACK
  // =================================================================
  const stageConfigurations: Record<
    string,
    { title: string; customerMsg: string; proMsg?: string; stageName: string }
  > = {
    PENDING: {
      stageName: "BOOKING_CONFIRMED",
      title: "Booking Confirmed & Escrow Held 🎉",
      customerMsg: `Your booking #${booking.reference} for ${serviceName} (${amountStr}) is confirmed! Escrow payment has been secured. Our location intelligence engine is dispatching the nearest verified artisan to you.`,
    },
    ASSIGNED: {
      stageName: "ARTISAN_ASSIGNED",
      title: "Artisan Partner Matched & Assigned 👨‍🔧",
      customerMsg: `Great news! ${proName} has been assigned to your ${serviceName} booking #${booking.reference}. They have been notified on WhatsApp and are preparing tools and equipment.`,
      proMsg: `New Job Assigned! You have been assigned to booking #${booking.reference} for ${serviceName} (${amountStr}) in Abuja/Expansion. Check job details to accept.`,
    },
    CONFIRMED: {
      stageName: "ARTISAN_MATCHED",
      title: "Artisan Partner Confirmed 👨‍🔧",
      customerMsg: `${proName} has confirmed your booking #${booking.reference} for ${serviceName}. They will arrive at the designated time.`,
      proMsg: `Booking #${booking.reference} confirmed. Please prepare equipment for dispatch.`,
    },
    EN_ROUTE: {
      stageName: "ON_THE_WAY",
      title: "Artisan is On The Way! 🛵",
      customerMsg: `${proName} is currently on the way to your address for booking #${booking.reference}. Track live GPS arrival on the radar.`,
      proMsg: `You are marked EN ROUTE to client location for booking #${booking.reference}.`,
    },
    ON_THE_WAY: {
      stageName: "ON_THE_WAY",
      title: "Artisan is On The Way! 🛵",
      customerMsg: `${proName} has departed and is on the way to your location for booking #${booking.reference}. Track live arrival on the radar.`,
      proMsg: `You are marked ON THE WAY to client for booking #${booking.reference}.`,
    },
    WORK_IN_PROGRESS: {
      stageName: "WORK_IN_PROGRESS",
      title: "Artisan Arrived & Work Started 🛠️",
      customerMsg: `${proName} has arrived at your premises and commenced work on your ${serviceName} service (Booking #${booking.reference}).`,
      proMsg: `Job started for booking #${booking.reference}. Work safely and take before/after photos.`,
    },
    IN_PROGRESS: {
      stageName: "WORK_IN_PROGRESS",
      title: "Artisan Arrived & Work Started 🛠️",
      customerMsg: `${proName} has arrived at your premises and commenced work on your ${serviceName} service (Booking #${booking.reference}).`,
      proMsg: `Job started for booking #${booking.reference}. Work safely and take before/after photos.`,
    },
    COMPLETED: {
      stageName: "JOB_COMPLETED",
      title: "Job Completed! Please Inspect & Confirm 🌟",
      customerMsg: `${proName} has marked your ${serviceName} job #${booking.reference} as completed! Please inspect the work and share your 4-digit OTP to release escrow payout.`,
      proMsg: `Job #${booking.reference} marked completed! Payout will be disbursed upon client OTP confirmation.`,
    },
    ESCROW_RELEASED: {
      stageName: "ESCROW_RELEASED",
      title: "Escrow Payment Disbursed 💰",
      customerMsg: `Payment of ${amountStr} for booking #${booking.reference} has been released to ${proName}. Thank you for choosing HandyHub Pro!`,
      proMsg: `Payout of ${amountStr} has been credited to your available wallet balance for booking #${booking.reference}.`,
    },
    CANCELLED: {
      stageName: "CANCELLED",
      title: "Booking Cancelled ❌",
      customerMsg: `Booking #${booking.reference} for ${serviceName} has been cancelled. If payment was made, your full escrow refund is available.`,
      proMsg: `Booking #${booking.reference} was cancelled.`,
    },
    REFUNDED: {
      stageName: "REFUNDED",
      title: "Escrow Refund Processed ↩️",
      customerMsg: `A full refund of ${amountStr} for booking #${booking.reference} has been credited to your wallet/payment method.`,
    },
  };

  const config = stageConfigurations[stage] || {
    stageName: stage,
    title: `Booking Update (${stage}) 🔔`,
    customerMsg: `Your booking #${booking.reference} status is now ${stage}.`,
  };

  // 1. Notify Customer (Client) via In-App and Email
  if (booking.customer) {
    await sendMultiChannelNotification({
      userId: booking.customerId,
      recipientEmail: booking.customer.email,
      recipientPhone: booking.customer.phone || undefined,
      recipientName: customerName,
      type: "BOOKING",
      title: config.title,
      message: config.customerMsg,
      bookingRef: booking.reference,
      stageName: config.stageName,
      artisanInfo,
      metadata: {
        "Booking Reference": `#${booking.reference}`,
        Service: serviceName,
        "Escrow Amount": amountStr,
        "Current Stage": config.stageName,
        "Artisan Name": proName,
        "Artisan Contact": proPhone,
      },
    });
  }

  // 2. Notify Professional (Artisan) via In-App and Email
  if (booking.professional && config.proMsg) {
    // Strict trade qualification guard: ensure the assigned artisan possesses verified trade/skills for this job
    const isProQualified = isArtisanQualifiedForJob(booking.professional, {
      serviceName,
      service: booking.service,
    });

    if (!isProQualified) {
      console.warn(`[Pro Notification Suppressed]: Artisan ${proName} does not possess matching trade skills for "${serviceName}". Notification skipped.`);
    } else {
      let proUserId = booking.professional.user?.id || (booking.professional as any)?.userId;
      if (!proUserId && booking.professional.user?.email) {
        try {
          const u = await prisma.user.findUnique({
            where: { email: booking.professional.user.email.toLowerCase().trim() },
            select: { id: true },
          });
          if (u) proUserId = u.id;
        } catch {}
      }

      if (proUserId) {
        await sendMultiChannelNotification({
          userId: proUserId,
          recipientEmail: booking.professional.user.email,
          recipientPhone: booking.professional.user.phone || undefined,
          recipientName: proName,
          type: "BOOKING",
          title: `Artisan Job Update: ${config.title}`,
          message: config.proMsg,
          bookingRef: booking.reference,
          stageName: config.stageName,
          metadata: {
            "Booking Reference": `#${booking.reference}`,
            Service: serviceName,
            "Job Price": amountStr,
            "Current Stage": config.stageName,
            "Customer Name": customerName,
            "Customer Phone": booking.customer?.phone || undefined,
            "Job Action": stage === "ASSIGNED" ? "ACCEPT_REQUIRED" : "UPDATE",
          },
        });
      }
    }
  }
}
