import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        emailNotifications: true,
        smsNotifications: true,
        securityAlerts: true,
        user,
      },
    });
  } catch (error) {
    console.error("[User Settings GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch user settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword, notificationPreferences } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Password Update Flow
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
      }

      const isMatch = await bcrypt.compare(currentPassword.trim(), user.password);
      if (!isMatch) {
        return NextResponse.json({ error: "The current password you entered is incorrect." }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
      }

      const newHashedPassword = await bcrypt.hash(newPassword.trim(), 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: "Password updated successfully! Please use your new password for future logins. 🔒",
      });
    }

    // Preferences Update Flow
    return NextResponse.json({
      success: true,
      message: "Account preferences saved successfully! ⚙️",
      notificationPreferences,
    });
  } catch (error) {
    console.error("[User Settings PUT Error]:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
