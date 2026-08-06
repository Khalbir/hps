import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, code, token } = await request.json();
    const targetCode = (code || token || "").trim();

    if (!email || !targetCode) {
      return NextResponse.json(
        { error: "Email address and 6-digit confirmation code are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user in PostgreSQL database
    let dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { professional: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Account not found for this email address" },
        { status: 404 }
      );
    }

    if (dbUser.isVerified) {
      // User is already verified, grant session
      const userPayload = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        isVerified: true,
      };

      const redirectPath = dbUser.role === "PROFESSIONAL" ? "/pro/verification" : "/dashboard";
      const response = NextResponse.json({
        success: true,
        message: "Account already verified! Logged in successfully.",
        redirect: redirectPath,
        user: userPayload,
      });

      const cookieName = dbUser.role === "PROFESSIONAL" ? "handyhub_pro_session" : "handyhub_user_session";
      response.cookies.set(cookieName, "authenticated", { path: "/", maxAge: 86400 * 30, sameSite: "lax" });
      response.cookies.set("handyhub_user_data", JSON.stringify(userPayload), { path: "/", maxAge: 86400 * 30, sameSite: "lax" });

      return response;
    }

    // Verify token / OTP match
    if (dbUser.verificationToken && dbUser.verificationToken !== targetCode) {
      return NextResponse.json(
        { error: "Invalid confirmation code. Please check your email and try again." },
        { status: 400 }
      );
    }

    // Update user status to verified
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        isVerified: true,
        verificationToken: null,
        tokenExpires: null,
      },
      include: { professional: true },
    });

    // Create Notification
    try {
      await prisma.notification.create({
        data: {
          userId: dbUser.id,
          type: "SYSTEM",
          title: "Account Activated! 🎉",
          message: "Your email address has been verified successfully.",
        },
      });
    } catch (err) {}

    const userPayload = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      isVerified: true,
    };

    const redirectPath = dbUser.role === "PROFESSIONAL" ? "/pro/verification" : "/dashboard";
    const response = NextResponse.json({
      success: true,
      message: "Email confirmed successfully! Welcome to HandyHub PRO.",
      redirect: redirectPath,
      user: userPayload,
    });

    const cookieName = dbUser.role === "PROFESSIONAL" ? "handyhub_pro_session" : "handyhub_user_session";
    response.cookies.set(cookieName, "authenticated", { path: "/", maxAge: 86400 * 30, sameSite: "lax" });
    response.cookies.set("handyhub_user_data", JSON.stringify(userPayload), { path: "/", maxAge: 86400 * 30, sameSite: "lax" });

    return response;
  } catch (error: any) {
    console.error("[Verify Email Exception]:", error);
    return NextResponse.json({
      error: "Failed to verify confirmation code. Please try again.",
    }, { status: 500 });
  }
}
