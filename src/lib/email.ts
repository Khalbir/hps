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
}: SendConfirmationEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const confirmUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  const otpFormatted = token.length === 6 ? `${token.substring(0, 3)} ${token.substring(3)}` : token;

  // SMTP Transporter configuration
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });

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

            ${isPro ? `
              <div class="offer-box">
                <strong>📋 Next Steps for Professionals:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #1e3a8a;">
                  <li>Enter your confirmation code above</li>
                  <li>Log in to your Professional Dashboard</li>
                  <li>Upload your trade verification documents to start accepting client dispatches</li>
                </ul>
              </div>
            ` : `
              <div class="offer-box">
                <strong>🎁 Special Welcome Offer:</strong>
                <p style="margin: 5px 0 0 0; color: #1e3a8a;">Use promo code <strong style="background:#dbeafe; padding:2px 6px; border-radius:4px;">WELCOME50</strong> on your first booking to get 50% off!</p>
              </div>
            `}

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

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"HandyHub PRO Solutions" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${token} is your HandyHub PRO Confirmation Code`,
        html: htmlContent,
      });
      console.log(`[Email Sent]: Real SMTP email delivered to ${email}`);
    } else {
      console.log(`\n=================================================`);
      console.log(`✉️ [EMAIL SIMULATION TO ${email}]:`);
      console.log(`SUBJECT: ${token} is your HandyHub PRO Confirmation Code`);
      console.log(`CONFIRMATION CODE: ${token}`);
      console.log(`DIRECT LINK: ${confirmUrl}`);
      console.log(`=================================================\n`);
    }
  } catch (err) {
    console.error("[Nodemailer Error]: Failed to send verification email:", err);
  }
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
  resetUrl,
}: SendPasswordResetParams) {
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
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; color: #ffffff; }
          .content { padding: 35px 30px; }
          .cta-btn { display: inline-block; background: #0ea5e9; color: #ffffff !important; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 20px 0; text-align: center; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset your HandyHub PRO account password. Click the button below to set a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="cta-btn" target="_blank">Reset My Password ➔</a>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">If you did not request a password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} HandyHub PRO Solutions. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"HandyHub PRO Solutions" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Reset Your HandyHub PRO Password",
        html: htmlContent,
      });
    } else {
      console.log(`✉️ [PASSWORD RESET EMAIL TO ${email}]: ${resetUrl}`);
    }
  } catch (err) {
    console.error("[Nodemailer Error]: Failed to send reset email:", err);
  }
}
