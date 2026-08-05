import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        users: [],
        professionals: [],
        bookings: [],
        payments: [],
      });
    }

    const q = query.trim();

    // Query across Customers/Users, Professionals, Bookings, Payments in parallel
    const [users, professionals, bookings, payments] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      }),

      prisma.professional.findMany({
        where: {
          OR: [
            { user: { firstName: { contains: q, mode: "insensitive" } } },
            { user: { lastName: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { idNumber: { contains: q, mode: "insensitive" } },
            { skills: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, phone: true },
          },
        },
      }),

      prisma.booking.findMany({
        where: {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { status: { contains: q, mode: "insensitive" } },
            { customer: { firstName: { contains: q, mode: "insensitive" } } },
            { customer: { lastName: { contains: q, mode: "insensitive" } } },
            { customer: { email: { contains: q, mode: "insensitive" } } },
            { service: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        take: 8,
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          service: { select: { name: true } },
        },
      }),

      prisma.payment.findMany({
        where: {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { provider: { contains: q, mode: "insensitive" } },
            { status: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        },
        take: 8,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      query: q,
      users,
      professionals,
      bookings,
      payments,
    });
  } catch (error) {
    console.error("[Global Search REST API Error]:", error);
    return NextResponse.json({ error: "Failed to perform global search" }, { status: 500 });
  }
}
