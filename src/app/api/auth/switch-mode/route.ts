import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { targetMode, userId, email } = await request.json();

    if (!targetMode || (targetMode !== "CLIENT" && targetMode !== "ARTISAN")) {
      return NextResponse.json(
        { error: "Valid targetMode ('CLIENT' | 'ARTISAN') is required." },
        { status: 400 }
      );
    }

    // 1. Resolve User from Database
    let dbUser = null;
    if (userId) {
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { professional: true },
      });
    }
    if (!dbUser && email) {
      dbUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { professional: true },
      });
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found. Please log in again." },
        { status: 404 }
      );
    }

    const isProfessional = dbUser.role === "PROFESSIONAL" || Boolean(dbUser.professional);

    // 2. CASE: Switch to CLIENT MODE
    if (targetMode === "CLIENT") {
      // Artisans can freely switch to Client mode because their documents are already verified
      const userPayload = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        phone: dbUser.phone,
        role: dbUser.role,
        isProfessional,
        activeMode: "CLIENT",
        canSwitchToClient: true,
        canSwitchToPro: isProfessional,
      };

      const response = NextResponse.json({
        success: true,
        activeMode: "CLIENT",
        redirect: "/dashboard",
        message: "Switched to Client Mode. You can now book services and manage client bookings.",
        user: userPayload,
      });

      response.cookies.set("handyhub_user_session", "authenticated", { path: "/", maxAge: 86400 * 30, sameSite: "lax" });
      response.cookies.set("handyhub_user_data", JSON.stringify(userPayload), { path: "/", maxAge: 86400 * 30, sameSite: "lax" });
      return response;
    }

    // 3. CASE: Switch to ARTISAN MODE
    if (targetMode === "ARTISAN") {
      // Strict Check: Client accounts CANNOT switch to a Professional account
      if (!isProfessional) {
        return NextResponse.json(
          {
            success: false,
            error: "Access Restricted: Client accounts cannot switch directly to a Professional account. Artisans must register and pass formal identity, address, and trade skill verification.",
            isProfessional: false,
            redirect: "/dashboard",
          },
          { status: 403 }
        );
      }

      const userPayload = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        phone: dbUser.phone,
        role: "PROFESSIONAL",
        isProfessional: true,
        activeMode: "ARTISAN",
        digitalId: dbUser.professional?.digitalId || "HHP-PRO-VERIFIED",
        canSwitchToClient: true,
        canSwitchToPro: true,
      };

      const response = NextResponse.json({
        success: true,
        activeMode: "ARTISAN",
        redirect: "/pro",
        message: "Switched to Artisan Workspace.",
        user: userPayload,
      });

      response.cookies.set("handyhub_pro_session", "authenticated", { path: "/", maxAge: 86400 * 30, sameSite: "lax" });
      response.cookies.set("handyhub_user_data", JSON.stringify(userPayload), { path: "/", maxAge: 86400 * 30, sameSite: "lax" });
      return response;
    }

    return NextResponse.json({ error: "Invalid mode switch request." }, { status: 400 });
  } catch (error: any) {
    console.error("[Switch Mode Error]:", error);
    return NextResponse.json(
      { error: "Failed to switch user mode." },
      { status: 500 }
    );
  }
}
