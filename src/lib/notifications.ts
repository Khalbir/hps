import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

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
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "23480042639482";
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
      const waSent = await sendWhatsAppNotification({
        phone: payload.recipientPhone,
        name: payload.recipientName || "HandyHub User",
        title: payload.title,
        message: payload.message,
        bookingRef: payload.bookingRef,
        stageName: payload.stageName,
        artisanInfo: payload.artisanInfo,
        metadata: payload.metadata,
      });
      results.WHATSAPP = waSent;
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
    ? `https://handyhubpro.ng/bookings/track?ref=${encodeURIComponent(params.bookingRef)}`
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
      ? 2
      : 1;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B1120; margin: 0; padding: 24px 12px; color: #E2E8F0; }
          .container { max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
          .header { background: linear-gradient(135deg, #0284C7 0%, #0F172A 100%); padding: 32px 24px; text-align: center; color: #ffffff; border-bottom: 1px solid #334155; }
          .badge-pill { background: rgba(14, 165, 233, 0.2); border: 1px solid #38BDF8; color: #38BDF8; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 12px; }
          .title { font-size: 24px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.02em; color: #FFFFFF; }
          .ref-tag { font-size: 13px; color: #94A3B8; }
          .content { padding: 28px 24px; }
          .greeting { font-size: 16px; font-weight: 700; color: #F8FAFC; margin-bottom: 14px; }
          .message-box { background: #0F172A; border-left: 4px solid #0EA5E9; padding: 18px; border-radius: 8px; margin-bottom: 24px; font-size: 15px; line-height: 1.6; color: #CBD5E1; }
          
          /* Visual Progress Tracker */
          .tracker-wrap { background: #0F172A; padding: 16px; border-radius: 10px; margin-bottom: 24px; border: 1px solid #334155; }
          .tracker-title { font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 700; margin-bottom: 12px; }
          .steps-row { display: flex; justify-content: space-between; position: relative; }
          .step-item { flex: 1; text-align: center; font-size: 11px; color: #64748B; font-weight: 600; }
          .step-item.active { color: #38BDF8; font-weight: 700; }
          .step-item.done { color: #10B981; }

          /* Artisan Dossier Card */
          .artisan-card { background: #0F172A; border: 1px solid #0EA5E9; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
          .artisan-title { font-size: 11px; color: #0EA5E9; text-transform: uppercase; font-weight: 800; margin-bottom: 8px; }
          .artisan-name { font-size: 16px; font-weight: 700; color: #F8FAFC; }
          .artisan-meta { font-size: 13px; color: #94A3B8; margin-top: 4px; }

          /* Action Buttons */
          .cta-btn { display: block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%); color: #FFFFFF !important; text-decoration: none; padding: 14px; border-radius: 10px; text-align: center; font-weight: 700; font-size: 14px; margin-bottom: 12px; }
          .wa-btn { display: block; width: 100%; box-sizing: border-box; background: #25D366; color: #FFFFFF !important; text-decoration: none; padding: 12px; border-radius: 10px; text-align: center; font-weight: 700; font-size: 13px; margin-bottom: 24px; }

          .meta-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          .meta-table td { padding: 10px 12px; border-bottom: 1px solid #334155; }
          .meta-label { color: #94A3B8; font-weight: 500; width: 38%; }
          .meta-val { color: #F8FAFC; font-weight: 700; }
          .footer { background: #0F172A; padding: 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #334155; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge-pill">🛡️ HandyHub Pro Concierge</div>
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
              💬 Chat Support on WhatsApp (+234 800 HANDY HUB)
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
            Official Support: support@handyhubpro.ng • Phone: +234 800 42639 482<br>
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
      console.log(`\n----------------------------------------`);
      console.log(`📧 [LIVE EMAIL NOTIFICATION] To: ${params.to}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Message: ${params.message}`);
      console.log(`Tracking Link: ${trackingUrl}`);
      console.log(`----------------------------------------\n`);
      return true;
    }
  } catch (err) {
    console.error("[Email Dispatch Failed]:", err);
    return false;
  }
}

/**
 * WhatsApp Notification Service Dispatcher (Termii, Meta Cloud API, or Twilio)
 */
async function sendWhatsAppNotification(params: {
  phone: string;
  name: string;
  title: string;
  message: string;
  bookingRef?: string;
  stageName?: string;
  artisanInfo?: {
    name: string;
    phone: string;
    trade: string;
    rating?: number;
  };
  metadata?: Record<string, any>;
}): Promise<boolean> {
  const formattedPhone = params.phone.replace(/^0/, "234").replace(/[^0-9]/g, "");
  const trackingUrl = params.bookingRef
    ? `https://handyhubpro.ng/bookings/track?ref=${encodeURIComponent(params.bookingRef)}`
    : "https://handyhubpro.ng/bookings";
  const waSupportLink = getWhatsAppSupportLink(params.bookingRef, params.stageName);

  const waMessage =
    `🔔 *HANDYHUB PRO LIVE NOTIFICATION*\n` +
    `*${params.title}*\n\n` +
    `Hello ${params.name},\n` +
    `${params.message}\n\n` +
    (params.artisanInfo
      ? `👨‍🔧 *Assigned Artisan:* ${params.artisanInfo.name}\n` +
        `📞 *Artisan Phone:* ${params.artisanInfo.phone}\n` +
        `🛠️ *Trade:* ${params.artisanInfo.trade}\n\n`
      : "") +
    (params.bookingRef ? `🔖 *Booking Ref:* #${params.bookingRef}\n` : "") +
    `🗺️ *Live GPS Radar & Tracking:*\n${trackingUrl}\n\n` +
    `💬 *Customer Support Concierge:*\n${waSupportLink}\n\n` +
    `_HandyHub Pro Solutions • Escrow-Protected On-Demand Services_`;

  // 1. Termii WhatsApp API Integration
  const termiiKey = process.env.TERMII_API_KEY;
  if (termiiKey) {
    try {
      await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: formattedPhone,
          from: "HandyHub",
          sms: waMessage,
          type: "plain",
          channel: "whatsapp",
          api_key: termiiKey,
        }),
      });
      return true;
    } catch (err) {
      console.warn("[Termii WhatsApp API Error]:", err);
    }
  }

  // 2. Meta WhatsApp Cloud API Integration
  const waToken = process.env.WHATSAPP_CLOUD_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (waToken && waPhoneId) {
    try {
      await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${waToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: { body: waMessage },
        }),
      });
      return true;
    } catch (err) {
      console.warn("[Meta WhatsApp API Error]:", err);
    }
  }

  // 3. Fallback Log (Instant Visibility)
  console.log(`\n========================================`);
  console.log(`💬 [WHATSAPP DISPATCH TO: +${formattedPhone}]`);
  console.log(waMessage);
  console.log(`========================================\n`);
  return true;
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
    yearsExperience?: number;
    rating?: number;
    user: { email: string; phone?: string | null; firstName: string; lastName: string };
  } | null;
  service?: { name: string } | null;
  estimatedPrice: number;
  scheduledTime?: string;
  address?: string;
}) {
  const customerName = booking.customer
    ? `${booking.customer.firstName} ${booking.customer.lastName}`.trim()
    : "Valued Customer";

  const proName = booking.professional
    ? `${booking.professional.user.firstName} ${booking.professional.user.lastName}`.trim()
    : "HandyHub Pro Verified Artisan";

  const proPhone = booking.professional?.user.phone || "+234 800 HANDY HUB";
  const amountStr = formatNaira(booking.estimatedPrice);
  const serviceName = booking.service?.name || "Professional Service";
  const stage = booking.status.toUpperCase();

  const artisanInfo = booking.professional
    ? {
        name: proName,
        phone: proPhone,
        trade: serviceName,
        rating: booking.professional.rating || 5.0,
      }
    : undefined;

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
      customerMsg: `Great news! ${proName} has been assigned to your ${serviceName} booking #${booking.reference}. They have been notified and are preparing tools and equipment.`,
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
      customerMsg: `${proName} has marked your ${serviceName} job #${booking.reference} as completed! Please inspect the work and confirm to release escrow payout.`,
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

  // 1. Notify Customer (Client) across Email, WhatsApp & In-App
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

  // 2. Notify Professional (Artisan)
  if (booking.professional && config.proMsg) {
    await sendMultiChannelNotification({
      userId: booking.professional.id || booking.professional.user.email,
      recipientEmail: booking.professional.user.email,
      recipientPhone: booking.professional.user.phone || undefined,
      recipientName: proName,
      type: "BOOKING",
      title: config.title,
      message: config.proMsg,
      bookingRef: booking.reference,
      stageName: config.stageName,
      metadata: {
        "Booking Reference": `#${booking.reference}`,
        Service: serviceName,
        "Job Price": amountStr,
        "Current Stage": config.stageName,
        "Customer Name": customerName,
      },
    });
  }
}
