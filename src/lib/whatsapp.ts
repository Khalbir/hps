/**
 * HandyHub Pro - Enterprise WhatsApp & SMS Dispatch Engine
 * Supports Termii (Nigeria Local Gateway + SMS Fallback), Meta WhatsApp Cloud API, and Twilio.
 */

export interface WhatsAppAlertOptions {
  recipientPhone: string;
  recipientName: string;
  title: string;
  body: string;
  bookingRef?: string;
  actionUrl?: string;
  actionLabel?: string;
  isUrgent?: boolean;
}

/**
 * Normalizes any Nigerian or international phone format into clean digits (e.g. 2348012345678)
 */
export function formatNigerianPhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9+]/g, "").trim();

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Convert 080... or 090... or 070... to 23480...
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "234" + cleaned.substring(1);
  }

  // If 10 digits without leading 0, assume Nigeria (e.g. 8012345678)
  if (cleaned.length === 10 && (cleaned.startsWith("8") || cleaned.startsWith("9") || cleaned.startsWith("7"))) {
    cleaned = "234" + cleaned;
  }

  return cleaned;
}

/**
 * Format currency for WhatsApp text messages
 */
export function formatNairaText(amount: number): string {
  return "₦" + Number(amount || 0).toLocaleString("en-NG");
}

/**
 * Core WhatsApp & SMS Dispatcher
 */
export async function sendWhatsAppAlert(options: WhatsAppAlertOptions): Promise<{ success: boolean; provider: string; details?: any }> {
  const formattedPhone = formatNigerianPhone(options.recipientPhone);
  if (!formattedPhone || formattedPhone.length < 10) {
    console.warn("[WhatsApp Engine] Invalid recipient phone number:", options.recipientPhone);
    return { success: false, provider: "none", details: "Invalid phone format" };
  }

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "2348122222936";
  const defaultActionUrl = options.bookingRef
    ? `https://handyhubpro.ng/track?ref=${encodeURIComponent(options.bookingRef)}`
    : "https://handyhubpro.ng";

  const actionUrl = options.actionUrl || defaultActionUrl;
  const actionLabel = options.actionLabel || "Open HandyHub Live Track";

  // Build clean, high-conversion WhatsApp message body
  const fullMessage =
    `🔔 *HANDYHUB PRO: ${options.title.toUpperCase()}*\n\n` +
    `Hello *${options.recipientName}*,\n\n` +
    `${options.body}\n\n` +
    (options.bookingRef ? `🔖 *Booking Reference:* #${options.bookingRef}\n` : "") +
    `👉 *${actionLabel}:*\n${actionUrl}\n\n` +
    `💬 *24/7 Support Hotline:* wa.me/${supportPhone}\n` +
    `_HandyHub Pro Solutions • Escrow-Secured Artisan Marketplace_`;

  // -------------------------------------------------------------
  // 1. PRIMARY PROVIDER: Termii (Local Nigerian Gateway & SMS Fallback)
  // -------------------------------------------------------------
  const termiiKey = process.env.TERMII_API_KEY;
  if (termiiKey) {
    try {
      // First attempt WhatsApp channel
      const res = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: formattedPhone,
          from: process.env.TERMII_SENDER_ID || "HandyHub",
          sms: fullMessage,
          type: "plain",
          channel: "whatsapp",
          api_key: termiiKey,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.message_id || data.code === "ok" || data.status === "success")) {
        console.log(`[Termii WhatsApp Success] Sent to +${formattedPhone}: #${options.bookingRef || "N/A"}`);
        return { success: true, provider: "termii_whatsapp", details: data };
      }

      // Automatic Fallback to SMS if WhatsApp delivery failed
      console.warn("[Termii WhatsApp Unavailable] Triggering automated SMS fallback to:", formattedPhone);
      const smsRes = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: formattedPhone,
          from: process.env.TERMII_SENDER_ID || "HandyHub",
          sms: `[HandyHub Pro] ${options.title}: ${options.body.substring(0, 140)}... Track: ${actionUrl}`,
          type: "plain",
          channel: "generic",
          api_key: termiiKey,
        }),
      });

      const smsData = await smsRes.json();
      return { success: true, provider: "termii_sms_fallback", details: smsData };
    } catch (err) {
      console.warn("[Termii Gateway Exception]:", err);
    }
  }

  // -------------------------------------------------------------
  // 2. SECONDARY PROVIDER: Meta WhatsApp Cloud API (Direct Official)
  // -------------------------------------------------------------
  const metaToken = process.env.WHATSAPP_CLOUD_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (metaToken && metaPhoneId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: { preview_url: true, body: fullMessage },
        }),
      });

      const data = await res.json();
      if (res.ok && data.messages) {
        console.log(`[Meta Cloud API Success] Sent to +${formattedPhone}: #${options.bookingRef || "N/A"}`);
        return { success: true, provider: "meta_cloud_api", details: data };
      } else {
        console.warn("[Meta Cloud API Response Error]:", data);
      }
    } catch (err) {
      console.warn("[Meta Cloud API Exception]:", err);
    }
  }

  // -------------------------------------------------------------
  // 3. TERTIARY PROVIDER: Twilio WhatsApp
  // -------------------------------------------------------------
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  if (twilioSid && twilioAuth) {
    try {
      const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
      const bodyParams = new URLSearchParams();
      bodyParams.append("From", twilioFrom);
      bodyParams.append("To", `whatsapp:+${formattedPhone}`);
      bodyParams.append("Body", fullMessage);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true, provider: "twilio_whatsapp", details: data };
      }
    } catch (err) {
      console.warn("[Twilio Exception]:", err);
    }
  }

  // -------------------------------------------------------------
  // 4. DEVELOPMENT / STAGING SIMULATOR
  // -------------------------------------------------------------
  console.log(`\n======================================================`);
  console.log(`💬 [WHATSAPP DISPATCH SIMULATOR] To: +${formattedPhone}`);
  console.log(`📌 Title: ${options.title}`);
  console.log(`📄 Message:\n${fullMessage}`);
  console.log(`🔗 Action Link: ${actionUrl}`);
  console.log(`======================================================\n`);

  return { success: true, provider: "simulator_logged" };
}

// =================================================================
// SPECIALIZED ARTISAN NOTIFICATION HELPERS
// =================================================================

/**
 * Send alert to Artisan about a new job posting or direct assignment
 */
export async function sendArtisanNewJobAlert(params: {
  artisanPhone: string;
  artisanName: string;
  serviceName: string;
  location: string;
  priceNgn: number;
  scheduledDate: string;
  scheduledTime: string;
  bookingRef: string;
}) {
  const body =
    `🚨 *NEW JOB AVAILABLE IN YOUR AREA!*\n\n` +
    `🛠️ *Service:* ${params.serviceName}\n` +
    `📍 *Location:* ${params.location}\n` +
    `💰 *Guaranteed Escrow Payout:* ${formatNairaText(params.priceNgn)}\n` +
    `📅 *Date & Time:* ${params.scheduledDate} (${params.scheduledTime})\n\n` +
    `Please tap below to review client notes, accept the job, and start dispatch.`;

  return sendWhatsAppAlert({
    recipientPhone: params.artisanPhone,
    recipientName: params.artisanName,
    title: "New Job Assignment Alert 👨‍🔧",
    body,
    bookingRef: params.bookingRef,
    actionUrl: "https://handyhubpro.ng/pro/jobs",
    actionLabel: "Tap to Review & Accept Job",
    isUrgent: true,
  });
}

/**
 * Send alert to Artisan when escrow payout is released
 */
export async function sendArtisanEscrowPayoutAlert(params: {
  artisanPhone: string;
  artisanName: string;
  bookingRef: string;
  serviceName: string;
  amountNgn: number;
  walletBalanceNgn?: number;
}) {
  const body =
    `💰 *ESCROW PAYMENT RELEASED TO YOUR WALLET!*\n\n` +
    `The client has verified completion for *${params.serviceName}* (#${params.bookingRef}).\n\n` +
    `💵 *Amount Credited:* ${formatNairaText(params.amountNgn)}\n` +
    (params.walletBalanceNgn !== undefined
      ? `💼 *Current Wallet Balance:* ${formatNairaText(params.walletBalanceNgn)}\n\n`
      : "\n") +
    `You can now withdraw your funds directly to your verified Nigerian bank account.`;

  return sendWhatsAppAlert({
    recipientPhone: params.artisanPhone,
    recipientName: params.artisanName,
    title: "Escrow Payout Credited 🎉",
    body,
    bookingRef: params.bookingRef,
    actionUrl: "https://handyhubpro.ng/pro/earnings",
    actionLabel: "View Wallet & Withdraw Funds",
  });
}

// =================================================================
// SPECIALIZED CLIENT NOTIFICATION HELPERS
// =================================================================

/**
 * Send alert to Client when booking is confirmed and payment held in escrow
 */
export async function sendClientBookingConfirmedAlert(params: {
  clientPhone: string;
  clientName: string;
  serviceName: string;
  bookingRef: string;
  amountNgn: number;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
}) {
  const body =
    `🛡️ *BOOKING CONFIRMED & ESCROW HELD*\n\n` +
    `Your request for *${params.serviceName}* has been received and confirmed.\n\n` +
    `💵 *Payment Held:* ${formatNairaText(params.amountNgn)} (Protected in Escrow)\n` +
    `📅 *Scheduled:* ${params.scheduledDate} at ${params.scheduledTime}\n` +
    `📍 *Address:* ${params.serviceAddress}\n\n` +
    `Our dispatch engine is matching the nearest verified artisan to your location.`;

  return sendWhatsAppAlert({
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    title: "Booking Confirmed 🎉",
    body,
    bookingRef: params.bookingRef,
    actionUrl: `https://handyhubpro.ng/track?ref=${encodeURIComponent(params.bookingRef)}`,
    actionLabel: "Track Live Dispatch Radar",
  });
}

/**
 * Send alert to Client when Artisan is en route
 */
export async function sendClientArtisanEnRouteAlert(params: {
  clientPhone: string;
  clientName: string;
  artisanName: string;
  artisanPhone: string;
  digitalId: string;
  serviceName: string;
  bookingRef: string;
  etaMinutes?: number;
}) {
  const body =
    `🚗 *YOUR ARTISAN IS ON THE WAY!*\n\n` +
    `👨‍🔧 *Artisan Partner:* ${params.artisanName}\n` +
    `🆔 *Official Digital ID:* ${params.digitalId}\n` +
    `📞 *Direct Phone:* ${params.artisanPhone}\n` +
    `⏳ *Estimated Arrival:* ~${params.etaMinutes || 25} minutes\n\n` +
    `You can track their live location in real time on your tracking radar.`;

  return sendWhatsAppAlert({
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    title: "Artisan En Route 🚗",
    body,
    bookingRef: params.bookingRef,
    actionUrl: `https://handyhubpro.ng/track?ref=${encodeURIComponent(params.bookingRef)}`,
    actionLabel: "Track Live Location & Artisan ID",
    isUrgent: true,
  });
}

/**
 * Send alert to Client when Artisan has arrived and started work
 */
export async function sendClientWorkInProgressAlert(params: {
  clientPhone: string;
  clientName: string;
  artisanName: string;
  serviceName: string;
  bookingRef: string;
}) {
  const body =
    `🛠️ *WORK IN PROGRESS*\n\n` +
    `*${params.artisanName}* has arrived at your premises, inspected the site, and started work for *${params.serviceName}*.\n\n` +
    `📸 The artisan has attached pre-work inspection photos to your live booking timeline for escrow safety.`;

  return sendWhatsAppAlert({
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    title: "Service Started 🛠️",
    body,
    bookingRef: params.bookingRef,
    actionUrl: `https://handyhubpro.ng/track?ref=${encodeURIComponent(params.bookingRef)}`,
    actionLabel: "View On-Site Inspection Evidence",
  });
}

/**
 * Send alert to Client when Artisan completes work and requests completion OTP
 */
export async function sendClientCompletionOtpAlert(params: {
  clientPhone: string;
  clientName: string;
  artisanName: string;
  serviceName: string;
  bookingRef: string;
  otpCode: string;
}) {
  const body =
    `✨ *JOB COMPLETED — ESCROW VERIFICATION OTP*\n\n` +
    `*${params.artisanName}* has completed the work for *${params.serviceName}* and uploaded proof photos.\n\n` +
    `🔐 *YOUR 4-DIGIT COMPLETION OTP CODE:* \n` +
    `👉 *[ ${params.otpCode} ]*\n\n` +
    `⚠️ *IMPORTANT SECURITY NOTICE:*\n` +
    `Only give this 4-digit code to the artisan AFTER inspecting the completed work and confirming you are 100% satisfied. Providing this code authorizes immediate escrow release.`;

  return sendWhatsAppAlert({
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    title: "Job Completed — Verify OTP 🔐",
    body,
    bookingRef: params.bookingRef,
    actionUrl: `https://handyhubpro.ng/track?ref=${encodeURIComponent(params.bookingRef)}`,
    actionLabel: "Inspect Work Photos & Approve Escrow",
    isUrgent: true,
  });
}
