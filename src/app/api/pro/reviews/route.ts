import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const proId = searchParams.get("proId");

    // 1. Resolve Professional Profile
    let professional = null;
    if (proId) {
      professional = await prisma.professional.findUnique({
        where: { id: proId },
        include: { user: true },
      });
    }

    if (!professional && userId) {
      professional = await prisma.professional.findUnique({
        where: { userId },
        include: { user: true },
      });
    }

    if (!professional && email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { professional: { include: { user: true } } },
      });
      if (user?.professional) {
        professional = user.professional;
      }
    }

    // Fallback: If no query params provided, resolve first verified or available pro
    if (!professional) {
      professional = await prisma.professional.findFirst({
        where: { verificationStatus: "VERIFIED" },
        include: { user: true },
      });
    }

    if (!professional) {
      return NextResponse.json({
        success: true,
        reviews: [],
        stats: {
          avg: 5.0,
          count: 0,
          fiveStarPct: "0%",
          fourStarPct: "0%",
          threeStarPct: "0%",
          twoStarPct: "0%",
          oneStarPct: "0%",
          breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      });
    }

    // 2. Query all reviews for this professional
    const dbReviews = await prisma.review.findMany({
      where: { professionalId: professional.id },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, avatar: true } },
        booking: {
          include: {
            service: { select: { name: true } },
            customer: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    });

    // 3. Compute Rating Breakdown Stats
    const totalCount = dbReviews.length;
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumRating = 0;

    for (const rev of dbReviews) {
      const r = Math.min(5, Math.max(1, Math.round(rev.rating)));
      breakdown[r] = (breakdown[r] || 0) + 1;
      sumRating += rev.rating;
    }

    const avgRating = totalCount > 0 ? Number((sumRating / totalCount).toFixed(1)) : (professional.rating || 5.0);

    const getPct = (stars: number) => {
      if (totalCount === 0) return "0%";
      return `${Math.round(((breakdown[stars] || 0) / totalCount) * 100)}%`;
    };

    // 4. Format Review Cards
    const formattedReviews = dbReviews.map((r) => {
      const customerObj = r.booking?.customer || r.customer;
      const custName = customerObj
        ? `${customerObj.firstName} ${customerObj.lastName ? customerObj.lastName.charAt(0) + '.' : ''}`.trim()
        : "Verified Customer";

      return {
        id: r.id,
        customer: custName,
        customerAvatar: customerObj?.avatar || null,
        rating: r.rating,
        service: r.booking?.service?.name || "HandyHub Verified Service",
        comment: r.comment || "Quality service completed satisfactorily.",
        date: new Date(r.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        verified: true,
      };
    });

    return NextResponse.json({
      success: true,
      artisanName: `${professional.user?.firstName || ''} ${professional.user?.lastName || ''}`.trim() || "Professional Artisan",
      digitalId: professional.digitalId || "HHP-PRO-VERIFIED",
      stats: {
        avg: avgRating,
        count: totalCount,
        fiveStarPct: getPct(5),
        fourStarPct: getPct(4),
        threeStarPct: getPct(3),
        twoStarPct: getPct(2),
        oneStarPct: getPct(1),
        breakdown,
      },
      reviews: formattedReviews,
    });
  } catch (error: any) {
    console.error("[Pro Reviews API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch artisan reviews" }, { status: 500 });
  }
}
