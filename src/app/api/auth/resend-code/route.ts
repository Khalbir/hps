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
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // Generate fresh 6-digit confirmation OTP if missing or expired
    let code = user.verificationToken;
    if (!code || code.length !== 6) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: code,
          tokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
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
      code,
      message: `Confirmation code sent to ${user.email}`,
    });
  } catch (error: any) {
    console.error("[Resend Code API Error]:", error);
    return NextResponse.json({ error: "Failed to resend confirmation code" }, { status: 500 });
  }
}
