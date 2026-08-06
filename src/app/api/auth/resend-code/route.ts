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

    // Find user in PostgreSQL database
    let dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "No account found for this email address" }, { status: 404 });
    }

    // Generate fresh 6-digit code if missing
    let code = dbUser.verificationToken;
    if (!code || code.length !== 6) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { verificationToken: code, tokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      });
    }

    // Trigger confirmation email and capture delivery status
    const emailResult = await sendConfirmationEmail({
      email: dbUser.email,
      name: `${dbUser.firstName} ${dbUser.lastName}`,
      role: dbUser.role,
      token: code,
    });

    return NextResponse.json({
      success: true,
      message: emailResult.success
        ? `Confirmation code sent to ${cleanEmail}.`
        : `Email dispatch update: ${emailResult.error || emailResult.message}`,
      emailStatus: emailResult,
      code: code, // Returns active code for instant activation
    });
  } catch (error: any) {
    console.error("[Resend Code API Error]:", error);
    return NextResponse.json({ error: "Failed to resend confirmation code: " + (error.message || "") }, { status: 500 });
  }
}
