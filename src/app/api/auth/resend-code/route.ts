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

    // Trigger confirmation email
    sendConfirmationEmail({
      email: dbUser.email,
      name: `${dbUser.firstName} ${dbUser.lastName}`,
      role: dbUser.role,
      token: code,
    }).catch((err) => console.error("[Resend Email Warning]:", err));

    return NextResponse.json({
      success: true,
      message: `Confirmation code processed for ${cleanEmail}.`,
      code: code, // Returns active code for seamless dev & staging activation
    });
  } catch (error) {
    console.error("[Resend Code API Error]:", error);
    return NextResponse.json({ error: "Failed to resend confirmation code" }, { status: 500 });
  }
}
