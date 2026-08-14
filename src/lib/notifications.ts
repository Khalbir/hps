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
 * Dispatch Multi-Channel Notifications (In-App Database + Email HTML + WhatsApp API Simulation)
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
      });
      results.IN_APP = true;
    }

    // 2. Email Dispatch via Nodemailer HTML Engine
    if (channels.includes("EMAIL") && payload.recipientEmail) {
      const emailSent = await sendEmailNotification({
        to: payload.recipientEmail,
        name: payload.recipientName || "Valued Customer",
        subject: payload.title,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata,
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
      });
      results.WHATSAPP = waSent;
    }
  } catch (error) {
    console.error("[Notification Dispatch Error]:", error);
  }

  return results;
}

/**
 * Send HTML Email Notification with Naira Formatting & HandyHub Pro Styling
 */
async function sendEmailNotification(params: {
  to: string;
  name: string;
  subject: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; margin: 0; padding: 20px; color: #E2E8F0; }
          .container { max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); padding: 30px; text-align: center; color: #ffffff; }
          .title { font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .subtitle { font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
          .content { padding: 30px; }
          .greeting { font-size: 16px; font-weight: 600; color: #F8FAFC; margin-bottom: 12px; }
          .message-card { background: #0F172A; border-left: 4px solid #0EA5E9; padding: 16px; border-radius: 6px; margin-bottom: 20px; font-size: 15px; line-height: 1.6; color: #94A3B8; }
          .meta-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
          .meta-table td { padding: 8px 12px; border-bottom: 1px solid #334155; }
          .meta-label { color: #64748B; font-weight: 500; width: 40%; }
          .meta-val { color: #F8FAFC; font-weight: 600; }
          .footer { background: #0F172A; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="subtitle">HandyHub Pro Solutions • Notification</div>
            <h1 class="title">${params.title}</h1>
          </div>
          <div class="content">
            <div class="greeting">Hello ${params.name},</div>
            <div class="message-card">
              ${params.message}
            </div>

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
            © ${new Date().getFullYear()} HandyHub Pro Solutions Nigeria. Abuja & Expanded States Headquarters.<br>
            For support, contact support@handyhubpro.ng or call +234 800 HANDY HUB.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"HandyHub Pro" <support@handyhubpro.ng>`,
        to: params.to,
        subject: params.subject,
        html: htmlContent,
      });
    } else {
      console.log(`\n----------------------------------------`);
      console.log(`📧 [EMAIL NOTIFICATION LOG] To: ${params.to}`);
      console.log(`Title: ${params.title}`);
      console.log(`Body: ${params.message}`);
      console.log(`----------------------------------------\n`);
    }
    return true;
  } catch (err) {
    console.error("[Email Dispatch Failed]:", err);
    return false;
  }
}

/**
 * WhatsApp Notification Service Dispatcher (Termii / Twilio / WhatsApp Cloud API integration layer)
 */
async function sendWhatsAppNotification(params: {
  phone: string;
  name: string;
  title: string;
  message: string;
}): Promise<boolean> {
  const waApiKey = process.env.WHATSAPP_API_KEY || process.env.TERMII_API_KEY;
  const formattedPhone = params.phone.replace(/^0/, "234");

  if (waApiKey) {
    try {
      // Integration hook for WhatsApp Business / Termii API endpoint
      await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: formattedPhone,
          from: "HandyHub",
          sms: `[HandyHub Pro] ${params.title}: ${params.message}`,
          type: "plain",
          channel: "whatsapp",
          api_key: waApiKey,
        }),
      });
      return true;
    } catch (err) {
      console.warn("[WhatsApp API Dispatch Error]:", err);
    }
  }

  // Fallback Simulation Log for Dev/Testing Environment
  console.log(`\n========================================`);
  console.log(`💬 [WHATSAPP DISPATCH] To: ${formattedPhone} (${params.name})`);
  console.log(`Message: 🔔 ${params.title}\n${params.message}`);
  console.log(`========================================\n`);
  return true;
}

/**
 * Dispatch booking status updates to Customer and Professional
 */
export async function notifyBookingStatusChange(booking: {
  id: string;
  reference: string;
  status: string;
  customerId: string;
  customer?: { email: string; phone?: string | null; firstName: string; lastName: string } | null;
  professional?: { user: { email: string; phone?: string | null; firstName: string; lastName: string } } | null;
  service?: { name: string } | null;
  estimatedPrice: number;
}) {
  const customerName = booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Customer";
  const proName = booking.professional ? `${booking.professional.user.firstName} ${booking.professional.user.lastName}` : "Assigned Artisan";
  const amountStr = formatNaira(booking.estimatedPrice);
  const serviceName = booking.service?.name || "Home Service";

  const statusMessages: Record<string, { title: string; customerMsg: string; proMsg?: string }> = {
    PENDING: {
      title: "Booking Received",
      customerMsg: `Your booking #${booking.reference} for ${serviceName} (${amountStr}) has been received and is pending artisan assignment.`,
    },
    ASSIGNED: {
      title: "Artisan Assigned",
      customerMsg: `Good news! ${proName} has been assigned to your booking #${booking.reference} for ${serviceName}.`,
      proMsg: `New Job Assigned! You have been assigned to booking #${booking.reference} for ${serviceName} (${amountStr}). Please accept or review details.`,
    },
    ACCEPTED: {
      title: "Booking Accepted",
      customerMsg: `${proName} accepted your booking #${booking.reference}. They will arrive at the scheduled time.`,
    },
    EN_ROUTE: {
      title: "Artisan En Route",
      customerMsg: `${proName} is currently on the way to your location for booking #${booking.reference}.`,
    },
    WORK_IN_PROGRESS: {
      title: "Work In Progress",
      customerMsg: `${proName} has started working on your ${serviceName} booking #${booking.reference}.`,
    },
    COMPLETED: {
      title: "Booking Completed",
      customerMsg: `Your service booking #${booking.reference} for ${serviceName} is completed! Total: ${amountStr}. Please rate your experience.`,
      proMsg: `Job completed! Booking #${booking.reference} marked completed. Earnings will be credited to your wallet.`,
    },
    CANCELLED: {
      title: "Booking Cancelled",
      customerMsg: `Booking #${booking.reference} for ${serviceName} has been cancelled. Contact support if you need assistance.`,
    },
    REFUNDED: {
      title: "Refund Processed",
      customerMsg: `A refund of ${amountStr} for booking #${booking.reference} has been processed to your wallet/payment channel.`,
    },
  };

  const config = statusMessages[booking.status] || {
    title: `Booking Updated (${booking.status})`,
    customerMsg: `Your booking #${booking.reference} status is now ${booking.status}.`,
  };

  // Notify Customer
  if (booking.customer) {
    await sendMultiChannelNotification({
      userId: booking.customerId,
      recipientEmail: booking.customer.email,
      recipientPhone: booking.customer.phone || undefined,
      recipientName: customerName,
      type: "BOOKING",
      title: config.title,
      message: config.customerMsg,
      metadata: { "Booking Reference": booking.reference, Status: booking.status, Service: serviceName, Amount: amountStr },
    });
  }

  // Notify Professional if applicable
  if (booking.professional && config.proMsg) {
    await sendMultiChannelNotification({
      userId: booking.professional.user.email,
      recipientEmail: booking.professional.user.email,
      recipientPhone: booking.professional.user.phone || undefined,
      recipientName: proName,
      type: "BOOKING",
      title: config.title,
      message: config.proMsg,
      metadata: { "Booking Reference": booking.reference, Status: booking.status, Service: serviceName },
    });
  }
}
