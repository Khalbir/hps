import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOutboundEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amount, paymentReference, provider = "PAYSTACK" } = body;

    if (!email) {
      return NextResponse.json({ error: "User email is required for top-up" }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 500) {
      return NextResponse.json({ error: "Minimum top-up amount is NGN ₦500" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          firstName: "Valued",
          lastName: "Customer",
          password: "$2a$10$e8wJp5f5.dummy_hash_placeholder",
          role: "CUSTOMER",
          isVerified: true,
        },
      });
    }

    // Upsert Wallet record and increment balance in real time
    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        balance: numericAmount,
        pendingEscrow: 0,
      },
      update: {
        balance: { increment: numericAmount },
      },
    });

    const reference = paymentReference || `TOPUP-${Date.now()}`;

    // Record Payment entry in PostgreSQL
    try {
      await prisma.payment.create({
        data: {
          reference,
          bookingId: `TOPUP-${Date.now()}`,
          userId: user.id,
          amount: numericAmount,
          currency: "NGN",
          provider,
          status: "SUCCESS",
          metadata: JSON.stringify({ description: "Wallet Escrow Top-Up", email: cleanEmail }),
        },
      });
    } catch (dbErr) {
      console.warn("[Wallet TopUp Payment Record Warning]:", dbErr);
    }

    // Send email notification confirmation
    try {
      const formattedAmount = `₦${numericAmount.toLocaleString("en-NG")}`;
      const newBalance = `₦${wallet.balance.toLocaleString("en-NG")}`;
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <h2 style="color: #10b981; margin-top: 0;">🎉 Wallet Top-Up Successful</h2>
              <p>Hello ${user.firstName || "Valued Client"},</p>
              <p>Your HandyHub PRO Escrow Wallet has been successfully credited in real time.</p>
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <div style="font-size: 13px; color: #047857; font-weight: bold; text-transform: uppercase;">Top-Up Amount</div>
                <div style="font-size: 24px; font-weight: bold; color: #065f46;">${formattedAmount}</div>
                <div style="font-size: 13px; color: #047857; margin-top: 8px;">New Available Wallet Balance: <strong>${newBalance}</strong></div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Reference: ${reference}</div>
              </div>
              <p style="font-size: 13px; color: #64748b;">You can now use your escrow wallet balance to instantly book verified home service professionals.</p>
              <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 25px;">
                © HandyHub PRO Solutions. All rights reserved.
              </div>
            </div>
          </body>
        </html>
      `;

      await sendOutboundEmail({
        to: cleanEmail,
        subject: `Wallet Top-Up Confirmed (${formattedAmount}) — HandyHub PRO`,
        html: emailHtml,
      });
    } catch (emailErr) {
      console.warn("[Wallet TopUp Email Warning]:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Wallet successfully credited with ₦${numericAmount.toLocaleString("en-NG")} in real-time!`,
      newBalance: wallet.balance,
      reference,
    });
  } catch (error) {
    console.error("[Wallet TopUp API Error]:", error);
    return NextResponse.json({ error: "Failed to top up wallet" }, { status: 500 });
  }
}
