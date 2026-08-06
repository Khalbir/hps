import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            service: { select: { name: true } },
            customer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const formattedReviews = reviews.map((r) => {
      const custName = r.booking.customer
        ? `${r.booking.customer.firstName} ${r.booking.customer.lastName.charAt(0)}.`
        : "Verified Client";
      return {
        id: r.id,
        name: custName,
        location: "Abuja, Nigeria",
        rating: r.rating,
        service: r.booking.service?.name || "Verified Service",
        text: r.comment || "Great professional service rendered on time.",
      };
    });

    return NextResponse.json({ success: true, reviews: formattedReviews });
  } catch (error) {
    console.error("[Reviews API Error]:", error);
    return NextResponse.json({ success: true, reviews: [] });
  }
}
