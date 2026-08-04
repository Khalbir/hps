import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Invalid verification token", request.url)
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Verification token not found or already used", request.url)
      );
    }

    // Check expiration if set
    if (user.tokenExpires && user.tokenExpires < new Date()) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Verification link expired. Please request a new one.", request.url)
      );
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        tokenExpires: null,
      },
    });

    // Create system notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Email Verified! ✅",
        message: "Your email address has been verified successfully.",
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "EMAIL_VERIFIED",
        entity: "User",
        entityId: user.id,
      },
    });

    // Redirect to login or dashboard with verified status
    const redirectPath = user.role === "PROFESSIONAL" ? "/pro?verified=true" : "/dashboard?verified=true";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=Failed to verify email", request.url)
    );
  }
}
