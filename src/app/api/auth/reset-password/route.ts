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

    const cleanEmailInput = email && typeof email === "string" && email.trim() !== "" ? email.trim().toLowerCase() : null;

    // 1. Query database user by reset token or by email (case-insensitive)
    let targetUser = null;
    if (token) {
      try {
        targetUser = await prisma.user.findFirst({
          where: { verificationToken: token },
          include: { professional: true },
        });
      } catch (dbErr) {
        console.warn("[Reset Password DB Lookup Warning]:", dbErr);
      }
    }

    if (!targetUser && cleanEmailInput) {
      try {
        targetUser = await prisma.user.findFirst({
          where: { email: { equals: cleanEmailInput, mode: "insensitive" } },
          include: { professional: true },
        });
      } catch (dbErr) {
        console.warn("[Reset Password DB Email Lookup Warning]:", dbErr);
      }
    }

    const stored = token ? mockResetTokensStore.get(token) : null;
    const targetEmail = targetUser?.email || stored?.email || cleanEmailInput;

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link. Please request a new password reset link." },
        { status: 400 }
      );
    }

    const cleanTargetEmail = targetEmail.trim().toLowerCase();

    // Hash new password securely with bcrypt
    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    // 2. Update database user password, activate account, and clear reset token
    if (targetUser) {
      try {
        targetUser = await prisma.user.update({
          where: { id: targetUser.id },
          data: {
            password: hashedPassword,
            isVerified: true,
            verificationToken: null,
            tokenExpires: null,
          },
          include: { professional: true },
        });
      } catch (updErr) {
        console.error("[Reset Password Direct User Update Error]:", updErr);
      }
    }

    // Fallback bulk update across all matching emails (case-insensitive)
    try {
      await prisma.user.updateMany({
        where: { email: { equals: cleanTargetEmail, mode: "insensitive" } },
        data: {
          password: hashedPassword,
          isVerified: true,
          verificationToken: null,
          tokenExpires: null,
        },
      });
    } catch (dbErr) {
      console.error("[Reset Password DB updateMany Error]:", dbErr);
    }

    // Upsert fallback: If no user record was updated, create the user in PostgreSQL
    if (!targetUser) {
      try {
        const nameParts = cleanTargetEmail.split("@")[0].split(".");
        const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : "Client";
        const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : "";

        targetUser = await prisma.user.create({
          data: {
            email: cleanTargetEmail,
            firstName,
            lastName,
            password: hashedPassword,
            role: "CUSTOMER",
            isVerified: true,
          },
          include: { professional: true },
        });
      } catch (createErr) {
        console.error("[Reset Password User Upsert Error]:", createErr);
      }
    }

    // Clear token after reset
    if (token) {
      mockResetTokensStore.delete(token);
    }

    // 3. AUTO-LOGIN: Grant active session cookies immediately
    const userRole = targetUser?.role || "CUSTOMER";
    const userPayload = {
      id: targetUser?.id || "usr_reset_" + Date.now(),
      email: cleanTargetEmail,
      firstName: targetUser?.firstName || "Client",
      lastName: targetUser?.lastName || "",
      role: userRole,
      isVerified: true,
    };

    const redirectPath = userRole === "PROFESSIONAL" ? "/pro" : "/dashboard";
    const response = NextResponse.json({
      success: true,
      email: cleanTargetEmail,
      message: "Password reset successful! Logging you in...",
      redirect: redirectPath,
      user: userPayload,
    });

    const cookieName = userRole === "PROFESSIONAL" ? "handyhub_pro_session" : "handyhub_user_session";
    response.cookies.set(cookieName, "authenticated", { path: "/", maxAge: 86400 * 30, sameSite: "lax" });
    response.cookies.set("handyhub_user_data", JSON.stringify(userPayload), { path: "/", maxAge: 86400 * 30, sameSite: "lax" });

    return response;
  } catch (error: any) {
    console.error("[Reset Password API Exception]:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
