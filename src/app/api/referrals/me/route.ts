import { NextResponse } from "next/server";
import { getUserReferralSummary } from "@/lib/referrals/engine";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const emailParam = searchParams.get("email");

    let targetUserId = userIdParam;

    if (!targetUserId && emailParam) {
      const user = await prisma.user.findFirst({
        where: { email: { equals: emailParam.trim(), mode: "insensitive" } },
        select: { id: true },
      });
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
      // Fallback: look for first user or return demo structure
      const firstUser = await prisma.user.findFirst({
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      if (firstUser) targetUserId = firstUser.id;
      else {
        return NextResponse.json({ error: "User identity required" }, { status: 400 });
      }
    }

    const summary = await getUserReferralSummary(targetUserId);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("[API Referrals Me Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load referral summary." },
      { status: 500 }
    );
  }
}
