import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/reviews - Get latest verified client reviews for homepage & testimonials
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            service: { select: { name: true } },
            customer: { select: { firstName: true, lastName: true } },
            professional: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    const formattedReviews = reviews.map((r) => {
      const custName = r.booking?.customer
        ? `${r.booking.customer.firstName} ${r.booking.customer.lastName.charAt(0)}.`
        : "Verified Client";

      const proName = r.booking?.professional?.user
        ? `${r.booking.professional.user.firstName} ${r.booking.professional.user.lastName}`
        : "Assigned Pro";

      return {
        id: r.id,
        name: custName,
        proName,
        rating: r.rating,
        service: r.booking?.service?.name || "Verified Service",
        text: r.comment || "Great professional service rendered on time.",
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({ success: true, reviews: formattedReviews });
  } catch (error: any) {
    console.error("[Reviews API Error]:", error);
    return NextResponse.json({ success: true, reviews: [] });
  }
}

// POST /api/reviews - Submit client rating & review for completed job
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, rating, comment } = body;

    if (!bookingId || !rating) {
      return NextResponse.json({ error: "Booking ID and Star Rating (1-5) are required" }, { status: 400 });
    }

    const ratingNum = Math.min(5, Math.max(1, Number(rating)));

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { professional: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Get customer ID and professional ID
    const customerId = booking.customerId;
    
    // If professionalId is missing on booking, get default pro or created pro
    let professionalId = booking.professionalId;

    if (!professionalId) {
      const firstPro = await prisma.professional.findFirst();
      if (firstPro) {
        professionalId = firstPro.id;
      } else {
        return NextResponse.json({ error: "No professional assigned to this booking yet" }, { status: 400 });
      }
    }

    // Create Review in DB
    const review = await prisma.review.create({
      data: {
        bookingId,
        customerId,
        professionalId,
        rating: ratingNum,
        comment: comment || "Great service rendered.",
      },
    });

    // Update Professional rating average
    const allProReviews = await prisma.review.findMany({
      where: { professionalId },
      select: { rating: true },
    });

    if (allProReviews.length > 0) {
      const total = allProReviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = Number((total / allProReviews.length).toFixed(1));

      await prisma.professional.update({
        where: { id: professionalId },
        data: { rating: avgRating },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your review and rating have been logged successfully.",
      review,
    });
  } catch (error: any) {
    console.error("[Submit Review Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to submit review" }, { status: 500 });
  }
}
