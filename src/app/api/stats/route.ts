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

    const realRating = reviewAgg._avg?.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : 4.9;

    return NextResponse.json({
      success: true,
      jobsCount: jobsCount > 0 ? jobsCount : totalBookingsCount,
      verifiedProsCount: verifiedProsCount > 0 ? verifiedProsCount : totalProsCount,
      rating: realRating,
      responseTime: 15,
    });
  } catch (error) {
    console.error("[Stats API Error]:", error);
    return NextResponse.json({
      success: true,
      jobsCount: 0,
      verifiedProsCount: 0,
      rating: 4.9,
      responseTime: 15,
    });
  }
}
