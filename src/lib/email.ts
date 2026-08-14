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

export async function sendConfirmationEmail({
  email,
  name,
  role,
  token,
}: SendConfirmationEmailParams): Promise<{ success: boolean; error?: string; message?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";
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
          .offer-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 6px; margin-bottom: 25px; }
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

  // 1. Check Resend API Integration first
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || process.env.SMTP_FROM || "HandyHub PRO Solutions <support@handyhubpro.ng>",
          to: [email],
          subject: `${token} is your HandyHub PRO Confirmation Code`,
          html: htmlContent,
        }),
      });

      const resendData = await resendRes.json();
      if (resendRes.ok) {
        console.log(`[Resend API Success]: Real email delivered to ${email} (ID: ${resendData.id})`);
        return { success: true, message: `Email delivered to ${email} via Resend` };
      } else {
        console.warn("[Resend API Error]:", resendData);
      }
    } catch (resendErr: any) {
      console.warn("[Resend API Exception]:", resendErr);
    }
  }

  // 2. SMTP Nodemailer Fallback
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";

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
        from: process.env.SMTP_FROM || `"HandyHub PRO Solutions" <support@handyhubpro.ng>`,
        to: email,
        subject: `${token} is your HandyHub PRO Confirmation Code`,
        html: htmlContent,
      });

      console.log(`[SMTP Email Delivered]: Real email sent to ${email} via ${smtpHost}`);
      return { success: true, message: `Email sent to ${email} via SMTP` };
    } catch (smtpErr: any) {
      console.error("[SMTP Transport Error]: Failed to send mail:", smtpErr);
      return {
        success: false,
        error: `SMTP Delivery Failed: ${smtpErr.message || "Invalid credentials or Gmail App Password required"}`,
      };
    }
  }

  // 3. Dev Mode Simulation
  console.log(`\n=================================================`);
  console.log(`✉️ [EMAIL SIMULATION TO ${email}]:`);
  console.log(`SUBJECT: ${token} is your HandyHub PRO Confirmation Code`);
  console.log(`CONFIRMATION CODE: ${token}`);
  console.log(`=================================================\n`);

  return {
    success: true,
    message: "Simulation mode: SMTP credentials missing in .env",
  };
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
  resetUrl,
}: SendPasswordResetParams) {
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";

  if (!smtpUser || !smtpPass) {
    console.log(`✉️ [PASSWORD RESET SIMULATION TO ${email}]: ${resetUrl}`);
    return;
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body>
        <h2>Password Reset Request</h2>
        <p>Hello ${name}, click below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"HandyHub PRO Solutions" <support@handyhubpro.ng>`,
      to: email,
      subject: "Reset Your HandyHub PRO Password",
      html: htmlContent,
    });
  } catch (err) {
    console.error("[Password Reset Email Error]:", err);
  }
}
