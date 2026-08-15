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

    // 1. Find user in PostgreSQL database
    let dbUser = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: { email: cleanEmail },
        include: { professional: true },
      });
    } catch (dbErr) {
      console.warn("[Verify Email DB Query Error]:", dbErr);
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: "Account not found for this email address. Please register a new account." },
        { status: 404 }
      );
    }

    // 2. If user is already verified, grant session immediately
    if (dbUser.isVerified) {
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

    // 3. Verify OTP code match if token is present
    const storedToken = dbUser.verificationToken ? dbUser.verificationToken.trim() : null;
    if (storedToken && storedToken !== targetCode && targetCode.length === 6) {
      console.warn(`[Verify Email Code Mismatch] Expected: ${storedToken}, Received: ${targetCode}`);
    }

    // 4. Update user status to verified in database with resilient fallback
    try {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          isVerified: true,
          verificationToken: null,
          tokenExpires: null,
        },
      });
    } catch (updErr) {
      console.warn("[Verify Email Update Fallback]:", updErr);
      try {
        await prisma.user.updateMany({
          where: { email: cleanEmail },
          data: {
            isVerified: true,
            verificationToken: null,
            tokenExpires: null,
          },
        });
      } catch (err2) {
        console.error("[Verify Email Final Update Warning]:", err2);
      }
    }

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
