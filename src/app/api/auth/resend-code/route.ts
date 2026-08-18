import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });
    } catch (dbErr) {
      console.warn("[Resend Code DB Query Warning]:", dbErr);
    }

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // Generate fresh 6-digit confirmation OTP if missing or invalid
    let code = user.verificationToken;
    if (!code || code.length !== 6) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationToken: code,
            tokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      } catch (updErr) {
        console.warn("[Resend Code DB Update Warning]:", updErr);
      }
    }

    // Trigger Real Outbound Email Dispatch
    sendConfirmationEmail({
      email: user.email,
      name: `${user.firstName || "Valued"} ${user.lastName || "Client"}`,
      role: user.role || "CUSTOMER",
      token: code,
    }).catch((err) => {
      console.warn("[Resend Email Async Warning]:", err);
    });

    return NextResponse.json({
      success: true,
      message: `A 6-digit confirmation code has been dispatched to ${user.email}. Please check your inbox.`,
    });
  } catch (error: any) {
    console.error("[Resend Code API Error]:", error);
    return NextResponse.json({ error: "Failed to resend confirmation code" }, { status: 500 });
  }
}
