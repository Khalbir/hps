import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_SEED_REVIEWS = [
  {
    rating: 5,
    comment: "Blessing was super thorough with the deep plumbing repair. Spotless clean work!",
    serviceName: "Plumbing leak audit",
  },
  {
    rating: 5,
    comment: "Fixed the burning wall socket quickly and explained safety tips. Excellent electrician.",
    serviceName: "Electrical repairs",
  },
  {
    rating: 4,
    comment: "Good AC servicing. Arrived on time and resolved the cooling issue.",
    serviceName: "AC split installation",
  },
];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            service: { select: { name: true } },
            customer: { select: { firstName: true, lastName: true, email: true } },
            professional: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });

    // AUTO-SEED: If 0 reviews, seed sample database reviews
    if (reviews.length === 0) {
      // Find a customer and booking to attach the seed reviews
      const customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
      const booking = await prisma.booking.findFirst({
        where: { status: "COMPLETED" },
        include: { service: true },
      });

      if (customer && booking) {
        for (const seed of DEFAULT_SEED_REVIEWS) {
          try {
            await prisma.review.create({
              data: {
                bookingId: booking.id,
                customerId: customer.id,
                professionalId: booking.professionalId || "pro_fallback",
                rating: seed.rating,
                comment: seed.comment,
              },
            });
          } catch (e) {}
        }

        reviews = await prisma.review.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            booking: {
              include: {
                service: { select: { name: true } },
                customer: { select: { firstName: true, lastName: true, email: true } },
                professional: { include: { user: { select: { firstName: true, lastName: true } } } },
              },
            },
          },
        });
      }
    }

    const formattedReviews = reviews.map((r) => {
      const b = r.booking || {};
      const c = (b.customer || {}) as any;
      const p = (b.professional?.user || {}) as any;

      return {
        id: r.id,
        customer: `${c.firstName || "Artisan"} ${c.lastName || "Partner"}`.trim(),
        pro: `${p.firstName || "HandyHub"} ${p.lastName || "Artisan"}`.trim(),
        rating: r.rating,
        comment: r.comment || "No comment provided.",
        service: b.service?.name || "Home Service Maintenance",
        date: new Date(r.createdAt).toLocaleDateString(),
      };
    });

    return NextResponse.json({ success: true, reviews: formattedReviews });
  } catch (error) {
    console.error("[Admin Reviews GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { reviewId, action } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    if (action === "DELETE") {
      await prisma.review.delete({ where: { id: reviewId } });
      return NextResponse.json({ success: true, message: "Review deleted successfully" });
    }

    return NextResponse.json({ error: "Unsupported moderation action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Reviews POST Error]:", error);
    return NextResponse.json({ error: "Failed to moderate review" }, { status: 500 });
  }
}
