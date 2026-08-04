import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Account is already verified" },
        { status: 200 }
      );
    }

    // Generate new token
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        tokenExpires,
      },
    });

    // Send email
    await sendConfirmationEmail({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      token: verificationToken,
    });

    return NextResponse.json({
      message: "Confirmation email sent successfully! Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
