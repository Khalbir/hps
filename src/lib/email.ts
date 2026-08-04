import nodemailer from "nodemailer";

interface SendConfirmationEmailParams {
  email: string;
  name: string;
  role: "CUSTOMER" | "PROFESSIONAL" | "ADMIN" | string;
  token: string;
}

export async function sendConfirmationEmail({
  email,
  name,
  role,
  token,
}: SendConfirmationEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const confirmUrl = `${baseUrl}/api/auth/verify?token=${token}`;

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
  const title = isPro ? "Verify Your Professional Account" : "Confirm Your HandyHub Pro Account";
  const badgeText = isPro ? "Professional Partner Registration" : "Customer Welcome Offer";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; background: rgba(59, 130, 246, 0.2); color: #60a5fa; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
          .title { font-size: 24px; font-weight: 700; margin: 0; }
          .content { padding: 35px 30px; }
          .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 15px; }
          .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px; }
          .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 15px 0 25px 0; text-align: center; }
          .offer-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 6px; margin-bottom: 25px; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">${badgeText}</div>
            <h1 class="title">HandyHub Pro Solutions</h1>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name},</div>
            <p class="message">
              Thank you for registering with <strong>HandyHub Pro</strong>! Please click the button below to confirm your email address and activate your ${isPro ? "Professional Partner Dashboard" : "Customer Account"}.
            </p>
            
            <div style="text-align: center;">
              <a href="${confirmUrl}" class="cta-btn" target="_blank">Confirm Email & Activate Account</a>
            </div>

            ${isPro ? `
              <div class="offer-box">
                <strong>📋 Next Steps for Professionals:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #1e3a8a;">
                  <li>Confirm your email address using the button above</li>
                  <li>Log in to your Professional Dashboard</li>
                  <li>Upload your verification documents to start accepting customer jobs</li>
                </ul>
              </div>
            ` : `
              <div class="offer-box">
                <strong>🎁 Special Welcome Offer:</strong>
                <p style="margin: 5px 0 0 0; color: #1e3a8a;">Use promo code <strong style="background:#dbeafe; padding:2px 6px; border-radius:4px;">WELCOME50</strong> on your first booking to get 50% off!</p>
              </div>
            `}

            <p class="message" style="font-size: 13px; color: #94a3b8;">
              If the button above does not work, copy and paste this link into your browser:<br>
              <a href="${confirmUrl}" style="color: #2563eb; word-break: break-all;">${confirmUrl}</a>
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} HandyHub Pro Solutions. All rights reserved.<br>
            If you did not create an account, please ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"HandyHub Pro" <noreply@handyhubpro.ng>`,
        to: email,
        subject: title,
        html: htmlContent,
      });
      console.log(`✉️ Confirmation email sent to ${email}`);
    } else {
      console.log(`\n========================================`);
      console.log(`📧 [EMAIL SIMULATION] Confirmation Email for ${name} (${role}):`);
      console.log(`To: ${email}`);
      console.log(`Subject: ${title}`);
      console.log(`Confirm Link: ${confirmUrl}`);
      console.log(`========================================\n`);
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    // Log fallback confirm link
    console.log(`🔗 Fallback verification link for ${email}: ${confirmUrl}`);
  }
}

interface SendPasswordResetEmailParams {
  email: string;
  name: string;
  token: string;
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: SendPasswordResetEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

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
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
          .title { font-size: 24px; font-weight: 700; margin: 0; }
          .content { padding: 35px 30px; }
          .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 15px; }
          .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px; }
          .cta-btn { display: inline-block; background: #dc2626; color: #ffffff !important; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin: 15px 0 25px 0; text-align: center; }
          .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; border-radius: 6px; margin-bottom: 25px; font-size: 14px; color: #991b1b; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">Security Notification</div>
            <h1 class="title">HandyHub Pro Solutions</h1>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name},</div>
            <p class="message">
              We received a request to reset your password for your <strong>HandyHub Pro</strong> account. Click the button below to set up a new password:
            </p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="cta-btn" target="_blank">Reset Account Password</a>
            </div>

            <div class="warning-box">
              <strong>⏰ Expiration Notice:</strong> This password reset link is valid for <strong>1 hour</strong> only. If you did not request a password reset, you can safely ignore this message.
            </div>

            <p class="message" style="font-size: 13px; color: #94a3b8;">
              If the button does not work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} HandyHub Pro Solutions. Security & Authentication Team.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"HandyHub Pro Security" <noreply@handyhubpro.ng>`,
        to: email,
        subject: "Reset Your HandyHub Pro Password",
        html: htmlContent,
      });
      console.log(`✉️ Password reset email sent to ${email}`);
    } else {
      console.log(`\n========================================`);
      console.log(`🔑 [EMAIL SIMULATION] Password Reset Link for ${name}:`);
      console.log(`To: ${email}`);
      console.log(`Reset Link: ${resetUrl}`);
      console.log(`========================================\n`);
    }
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    console.log(`🔗 Fallback password reset link for ${email}: ${resetUrl}`);
  }
}
