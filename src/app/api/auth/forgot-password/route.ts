import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

// Temporary in-memory reset token storage for demo mode when database is not connected
export const mockResetTokensStore = new Map<string, { email: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Generate secure crypto token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour expiration

    // Store token
    mockResetTokensStore.set(token, { email, expires });

    // Send email
    const name = email.split("@")[0] || "User";
    await sendPasswordResetEmail({
      email,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      token,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset instructions have been sent to your email address.",
      resetUrlPreview: `http://localhost:3000/auth/reset-password?token=${token}`,
    });
  } catch (error) {
    console.error("[Forgot Password API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error requesting password reset" },
      { status: 500 }
    );
  }
}
