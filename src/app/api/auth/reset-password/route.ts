import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { mockResetTokensStore } from "../forgot-password/route";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check token validity in demo store
    const stored = mockResetTokensStore.get(token);

    if (!stored) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token. Please request a new link." },
        { status: 400 }
      );
    }

    if (Date.now() > stored.expires) {
      mockResetTokensStore.delete(token);
      return NextResponse.json(
        { error: "Password reset token has expired. Please request a new link." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Clear token after successful reset
    mockResetTokensStore.delete(token);

    return NextResponse.json({
      success: true,
      email: stored.email,
      message: "Your password has been successfully reset! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("[Reset Password API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error resetting password" },
      { status: 500 }
    );
  }
}
