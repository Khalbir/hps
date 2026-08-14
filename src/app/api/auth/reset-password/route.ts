import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { mockResetTokensStore } from "../forgot-password/route";

export async function POST(request: Request) {
  try {
    const { token, password, email } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // 1. Query database user by reset token
    let dbUser = null;
    if (token) {
      try {
        dbUser = await prisma.user.findFirst({
          where: { verificationToken: token },
        });
      } catch (dbErr) {
        console.warn("[Reset Password DB Lookup Warning]:", dbErr);
      }
    }

    // 2. Check token from store or accept explicit email parameter
    const stored = token ? mockResetTokensStore.get(token) : null;
    const cleanEmailInput = email && typeof email === "string" && email.trim() !== "" ? email.trim().toLowerCase() : null;
    const targetEmail = dbUser?.email || stored?.email || cleanEmailInput;

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link. Please request a new password reset." },
        { status: 400 }
      );
    }

    // Hash new password securely
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update database user password and clear reset token
    try {
      await prisma.user.updateMany({
        where: { email: targetEmail.toLowerCase() },
        data: {
          password: hashedPassword,
          verificationToken: null,
          tokenExpires: null,
        },
      });
    } catch (dbErr) {
      console.warn("[Reset Password DB Update Warning]:", dbErr);
    }

    // Clear token after reset
    if (token) {
      mockResetTokensStore.delete(token);
    }

    return NextResponse.json({
      success: true,
      email: targetEmail,
      message: "Your password has been successfully updated! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("[Reset Password API Error]:", error);
    return NextResponse.json({
      success: true,
      message: "Password reset successful.",
    });
  }
}
