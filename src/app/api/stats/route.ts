import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [jobsCount, verifiedProsCount] = await Promise.all([
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.professional.count({ where: { verificationStatus: "VERIFIED" } }),
    ]);

    return NextResponse.json({
      success: true,
      jobsCount,
      verifiedProsCount,
      rating: 5.0,
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
