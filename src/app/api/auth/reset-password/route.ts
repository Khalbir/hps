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

    // 1. Query database user by reset token or by email
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

    if (!dbUser && cleanEmailInput) {
      try {
        dbUser = await prisma.user.findFirst({
          where: { email: cleanEmailInput },
        });
      } catch (dbErr) {
        console.warn("[Reset Password DB Email Lookup Warning]:", dbErr);
      }
    }

    const stored = token ? mockResetTokensStore.get(token) : null;
    const targetEmail = dbUser?.email || stored?.email || cleanEmailInput;

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link. Please request a new password reset link." },
        { status: 400 }
      );
    }

    const cleanTargetEmail = targetEmail.trim().toLowerCase();

    // Hash new password securely with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update database user password, activate account, and clear reset token
    let updateCount = 0;
    try {
      const updateResult = await prisma.user.updateMany({
        where: { email: cleanTargetEmail },
        data: {
          password: hashedPassword,
          isVerified: true,
          verificationToken: null,
          tokenExpires: null,
        },
      });
      updateCount = updateResult.count;
    } catch (dbErr) {
      console.error("[Reset Password DB Update Error]:", dbErr);
    }

    // If updateMany matched 0 rows, create/upsert the user in PostgreSQL so login immediately works
    if (updateCount === 0) {
      try {
        const nameParts = cleanTargetEmail.split("@")[0].split(".");
        const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : "Client";
        const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : "";

        await prisma.user.create({
          data: {
            email: cleanTargetEmail,
            firstName,
            lastName,
            password: hashedPassword,
            role: "CUSTOMER",
            isVerified: true,
          },
        });
        updateCount = 1;
      } catch (createErr) {
        console.error("[Reset Password User Upsert Error]:", createErr);
      }
    }

    if (updateCount === 0) {
      return NextResponse.json(
        { error: "Failed to update password in database. Please try again." },
        { status: 500 }
      );
    }

    // Clear token after reset
    if (token) {
      mockResetTokensStore.delete(token);
    }

    return NextResponse.json({
      success: true,
      email: cleanTargetEmail,
      message: "Your password has been successfully updated! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("[Reset Password API Error]:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
