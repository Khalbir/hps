import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { mockResetTokensStore } from "../forgot-password/route";
import { updateStaffPassword } from "@/lib/staff-registry";
import { storeCredential } from "@/lib/credentials-store";

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

    if (!targetUser && !targetEmail) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link. Please request a new password reset link." },
        { status: 400 }
      );
    }

    const cleanTargetEmail = (targetEmail || "").trim().toLowerCase();
    const cleanPassword = password.trim();

    // Hash new password securely with bcrypt
    const hashedPassword = await bcrypt.hash(cleanPassword, 12);

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

    // Fallback update across matching email
    if (!targetUser && cleanTargetEmail) {
      try {
        const updateRes = await prisma.user.updateMany({
          where: { email: { equals: cleanTargetEmail, mode: "insensitive" } },
          data: {
            password: hashedPassword,
            isVerified: true,
            verificationToken: null,
            tokenExpires: null,
          },
        });
        if (updateRes.count > 0) {
          targetUser = await prisma.user.findFirst({
            where: { email: { equals: cleanTargetEmail, mode: "insensitive" } },
            include: { professional: true },
          });
        }
      } catch (dbErr) {
        console.error("[Reset Password DB updateMany Error]:", dbErr);
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "No account found matching this password reset request." },
        { status: 400 }
      );
    }

    // 3. Keep Staff Registry & Credentials Store in sync
    try {
      updateStaffPassword(cleanTargetEmail, cleanPassword);
    } catch (e) {
      console.warn("[Reset Password Staff Registry Warning]:", e);
    }

    const userRole = targetUser.role || "CUSTOMER";
    const userPayload = {
      id: targetUser.id,
      email: cleanTargetEmail,
      firstName: targetUser.firstName || "Client",
      lastName: targetUser.lastName || "",
      role: userRole,
      isVerified: true,
    };

    storeCredential(cleanTargetEmail, cleanPassword, userPayload);

    // Clear token after reset
    if (token) {
      mockResetTokensStore.delete(token);
    }

    // 4. Grant active session cookies immediately
    const redirectPath = userRole === "PROFESSIONAL" ? "/pro" : userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard";
    const response = NextResponse.json({
      success: true,
      email: cleanTargetEmail,
      message: "Password reset successful! Logging you in...",
      redirect: redirectPath,
      user: userPayload,
    });

    const cookieName = userRole === "PROFESSIONAL" ? "handyhub_pro_session" : userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? "handyhub_admin_session" : "handyhub_user_session";
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
