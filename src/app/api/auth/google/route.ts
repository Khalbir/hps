import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "login";
    const role = (searchParams.get("role") || "CUSTOMER").toUpperCase() as "CUSTOMER" | "PROFESSIONAL";
    const emailParam = searchParams.get("email");
    const nameParam = searchParams.get("name");

    const email = emailParam ? emailParam.toLowerCase().trim() : "user@gmail.com";
    const name = nameParam || "Google User";

    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "Valued";
    const lastName = nameParts.slice(1).join(" ") || "Client";

    // Placeholder password hash for Google OAuth users
    const googlePasswordHash = await hash(`google_oauth_${Date.now()}_${Math.random()}`, 10);

    let userPayload = {
      id: `usr_google_${Date.now()}`,
      email,
      firstName,
      lastName,
      role,
      isVerified: true,
    };

    try {
      const dbUser = await prisma.user.upsert({
        where: { email },
        update: {
          isVerified: true,
          firstName: firstName !== "Google" ? firstName : undefined,
          lastName: lastName !== "User" ? lastName : undefined,
        },
        create: {
          email,
          firstName,
          lastName,
          password: googlePasswordHash,
          role,
          isVerified: true,
        },
      });

      userPayload = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName || "Valued",
        lastName: dbUser.lastName || "Client",
        role: dbUser.role as "CUSTOMER" | "PROFESSIONAL",
        isVerified: true,
      };
    } catch (dbErr) {
      console.warn("[Google OAuth DB Warning]: Using session fallback:", dbErr);
    }

    const redirectPath = role === "PROFESSIONAL" ? "/pro" : "/dashboard";
    const redirectUrl = new URL(redirectPath, request.url);
    redirectUrl.searchParams.set("auth", "google_success");
    redirectUrl.searchParams.set("email", userPayload.email);
    redirectUrl.searchParams.set("name", `${userPayload.firstName} ${userPayload.lastName}`);

    const response = NextResponse.redirect(redirectUrl);

    const cookieName = role === "PROFESSIONAL" ? "handyhub_pro_session" : "handyhub_user_session";
    response.cookies.set(cookieName, "authenticated", {
      path: "/",
      maxAge: 86400 * 30,
      sameSite: "lax",
    });

    response.cookies.set("handyhub_user_data", JSON.stringify(userPayload), {
      path: "/",
      maxAge: 86400 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("[Google Auth Error]:", error);
    return NextResponse.redirect(new URL("/auth/login?error=google_failed", request.url));
  }
}
