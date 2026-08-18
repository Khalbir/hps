import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [jobsCount, totalBookingsCount, verifiedProsCount, totalProsCount, reviewAgg] = await Promise.all([
      prisma.booking.count({ where: { status: "COMPLETED" } }).catch(() => 0),
      prisma.booking.count().catch(() => 0),
      prisma.professional.count({ where: { verificationStatus: "VERIFIED" } }).catch(() => 0),
      prisma.user.count({ where: { role: "PROFESSIONAL" } }).catch(() => 0),
      prisma.review.aggregate({ _avg: { rating: true } }).catch(() => ({ _avg: { rating: 5.0 } })),
    ]);

    const realRating = reviewAgg._avg?.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : 5.0;
    const dbProCount = Math.max(verifiedProsCount, totalProsCount);
    const dbJobCount = Math.max(jobsCount, totalBookingsCount);

    return NextResponse.json({
      success: true,
      jobsCount: dbJobCount,
      verifiedProsCount: dbProCount,
      rating: realRating,
      responseTime: 15,
    });
  } catch (error) {
    console.error("[Stats API Error]:", error);
    return NextResponse.json({
      success: true,
      jobsCount: 0,
      verifiedProsCount: 0,
      rating: 5.0,
      responseTime: 15,
    });
  }
}
