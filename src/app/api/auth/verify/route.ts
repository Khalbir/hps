import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Invalid verification token", request.url)
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Verification link expired or already confirmed", request.url)
      );
    }

    // Update user to verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        tokenExpires: null,
      },
    });

    // Create system notification
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Email Verified! ✅",
          message: "Your email address has been verified successfully.",
        },
      });
    } catch (e) {}

    const userPayload = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      isVerified: true,
    };

    const targetUrl = updatedUser.role === "PROFESSIONAL" ? "/pro?verified=1" : "/dashboard?verified=1";
    const response = NextResponse.redirect(new URL(targetUrl, request.url));

    const cookieName = updatedUser.role === "PROFESSIONAL" ? "handyhub_pro_session" : "handyhub_user_session";
    response.cookies.set(cookieName, "authenticated", { path: "/", maxAge: 86400 * 30, sameSite: "lax" });
    response.cookies.set("handyhub_user_data", JSON.stringify(userPayload), { path: "/", maxAge: 86400 * 30, sameSite: "lax" });

    return response;
  } catch (error) {
    console.error("[Verify Route Error]:", error);
    return NextResponse.redirect(new URL("/auth/login?error=Verification_failed", request.url));
  }
}
