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

    const cleanEmail = email.trim().toLowerCase();

    // Generate secure crypto token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour expiration

    // Store token
    mockResetTokensStore.set(token, { email: cleanEmail, expires });

    // Determine dynamic base URL (Live Domain vs Localhost)
    const host = request.headers.get("host") || "";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const origin = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng");
    const resetUrl = `${origin}/auth/reset-password?token=${token}`;

    // Send password reset email from info@handyhubpro.ng
    const name = cleanEmail.split("@")[0] || "User";
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    await sendPasswordResetEmail({
      email: cleanEmail,
      name: formattedName,
      token,
      resetUrl,
    }).catch((err) => {
      console.error("[Email Sending Warning]:", err);
    });

    return NextResponse.json({
      success: true,
      message: `Password reset instructions have been dispatched to ${cleanEmail} from info@handyhubpro.ng.`,
      resetUrlPreview: resetUrl,
    });
  } catch (error) {
    console.error("[Forgot Password API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error requesting password reset" },
      { status: 500 }
    );
  }
}
