import nodemailer from "nodemailer";

interface SendConfirmationEmailParams {
  email: string;
  name: string;
  role: "CUSTOMER" | "PROFESSIONAL" | "ADMIN" | string;
  token: string;
}

interface SendPasswordResetParams {
  email: string;
  name: string;
  token: string;
  resetUrl: string;
}

interface SendProfileUpdateParams {
  email: string;
  name: string;
  updatedFields: string[];
}

/**
 * Universal Outbound Email Sender with Multi-Sender Resend Failovers and SMTP Fallback
 */
async function sendOutboundEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const candidateSenders = [
      "HandyHub PRO Solutions <no-reply@support.handyhubpro.ng>",
      "HandyHub PRO Solutions <support@support.handyhubpro.ng>",
      "HandyHub PRO <onboarding@resend.dev>",
    ];

    for (const fromSender of candidateSenders) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromSender,
            to: [to],
            subject,
            html,
          }),
        });

        const resendData = await resendRes.json();

        if (resendRes.ok && resendData.id) {
          console.log(`[Resend API Success] (${fromSender}): Delivered to ${to} (ID: ${resendData.id})`);
          return { success: true, message: `Delivered via Resend to ${to}` };
        } else {
          console.warn(`[Resend API Attempt Failed] (${fromSender}):`, resendData);
        }
      } catch (err: any) {
        console.warn(`[Resend API Exception] (${fromSender}):`, err);
      }
    }
  }

  // Fallback to Nodemailer SMTP
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  if (smtpUser && smtpPass) {
    try {
      const isGmail = smtpHost.includes("gmail");
      const transporter = nodemailer.createTransport(
        isGmail
          ? {
              service: "gmail",
              auth: { user: smtpUser, pass: smtpPass.replace(/\s+/g, "") },
            }
          : {
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: { user: smtpUser, pass: smtpPass },
              tls: { rejectUnauthorized: false },
            }
      );

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"HandyHub PRO Solutions" <no-reply@support.handyhubpro.ng>`,
        to,
        subject,
        html,
      });

      console.log(`[SMTP Email Delivered]: Delivered to ${to} via ${smtpHost}`);
      return { success: true, message: `Delivered via SMTP (${smtpHost})` };
    } catch (smtpErr: any) {
      console.error("[SMTP Transport Error]: Failed to send mail:", smtpErr);
      return { success: false, error: `SMTP Failed: ${smtpErr.message}` };
    }
  }

  console.log(`✉️ [EMAIL SIMULATION TO ${to}]: ${subject}`);
  return { success: true, message: "Simulation mode output" };
}

export async function sendConfirmationEmail({
  email,
  name,
  role,
  token,
}: SendConfirmationEmailParams): Promise<{ success: boolean; error?: string; message?: string }> {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";
  const confirmUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  const otpFormatted = token.length === 6 ? `${token.substring(0, 3)} ${token.substring(3)}` : token;

  const isPro = role === "PROFESSIONAL";
  const badgeText = isPro ? "Professional Partner Registration" : "Customer Welcome Verification";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; background: rgba(59, 130, 246, 0.2); color: #60a5fa; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
          .title { font-size: 24px; font-weight: 700; margin: 0; }
          .content { padding: 35px 30px; }
          .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 15px; }
          .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px; }
          .otp-box { background: #f8fafc; border: 2px dashed #0ea5e9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0ea5e9; font-family: monospace; }
          .cta-btn { display: inline-block; background: #0ea5e9; color: #ffffff !important; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 15px 0; text-align: center; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">${badgeText}</div>
            <h1 class="title">HandyHub PRO Solutions</h1>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name},</div>
            <p class="message">
              Thank you for registering with <strong>HandyHub PRO</strong>! Enter your 6-digit confirmation code below or click the verification button to activate your ${isPro ? "Professional Partner Dashboard" : "Customer Account"}.
            </p>
            
            <div class="otp-box">
              <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">Your Confirmation Code</div>
              <div class="otp-code">${otpFormatted}</div>
            </div>

            <div style="text-align: center;">
              <a href="${confirmUrl}" class="cta-btn" target="_blank">Click Here to Confirm & Activate ➔</a>
            </div>

            <p class="message" style="font-size: 13px; color: #94a3b8;">
              Verification Link: <a href="${confirmUrl}" style="color: #0ea5e9; word-break: break-all;">${confirmUrl}</a>
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} HandyHub PRO Solutions. All rights reserved.<br>
            If you did not create an account, please ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendOutboundEmail({
    to: email,
    subject: `${token} is your HandyHub PRO Confirmation Code`,
    html: htmlContent,
  });
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
  resetUrl,
}: SendPasswordResetParams) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
          .title { font-size: 24px; font-weight: 700; margin: 0; }
          .content { padding: 35px 30px; }
          .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 15px; }
          .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px; }
          .cta-btn { display: inline-block; background: #0ea5e9; color: #ffffff !important; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 15px 0; text-align: center; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">Password Reset Request</div>
            <h1 class="title">HandyHub PRO Solutions</h1>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name},</div>
            <p class="message">
              We received a request to reset your account password. Click the button below to set a new password. This link expires in 1 hour.
            </p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="cta-btn" target="_blank">Reset My Password ➔</a>
            </div>
            <p class="message" style="font-size: 13px; color: #94a3b8; margin-top: 20px;">
              Reset Link: <a href="${resetUrl}" style="color: #0ea5e9; word-break: break-all;">${resetUrl}</a>
            </p>
            <p class="message" style="font-size: 13px; color: #94a3b8;">
              If you did not request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} HandyHub PRO Solutions. All rights reserved.<br>
            For support, contact support@handyhubpro.ng
          </div>
        </div>
      </body>
    </html>
  `;

  return sendOutboundEmail({
    to: email,
    subject: "Reset Your HandyHub PRO Password",
    html: htmlContent,
  });
}

export async function sendProfileUpdateEmail({
  email,
  name,
  updatedFields,
}: SendProfileUpdateParams): Promise<void> {
  const fieldList = updatedFields.length > 0 ? updatedFields.join(", ") : "Personal Information & Profile Settings";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
          .title { font-size: 24px; font-weight: 700; margin: 0; }
          .content { padding: 35px 30px; }
          .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 15px; }
          .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
          .field-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px 20px; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">Account Security & Profile Confirmation</div>
            <h1 class="title">HandyHub PRO Solutions</h1>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name || "Valued Client"},</div>
            <p class="message">
              This email confirms that your <strong>HandyHub PRO profile details</strong> were recently updated successfully.
            </p>
            
            <div class="field-box">
              <div style="font-size: 12px; color: #059669; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Updated Profile Fields</div>
              <div style="font-size: 15px; font-weight: 600; color: #065f46;">${fieldList}</div>
            </div>

            <p class="message">
              If you authorized these changes, no further action is required. If you did not make these edits, please contact support immediately.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} HandyHub PRO Solutions. All rights reserved.<br>
            Security notification sent to ${email}
          </div>
        </div>
      </body>
    </html>
  `;

  await sendOutboundEmail({
    to: email,
    subject: "Your HandyHub PRO Profile Details Were Updated",
    html: htmlContent,
  });
}
