import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminEmails = [
      "admin@handyhubpro.ng",
      "admin@handyhubpro.com",
      "khaleid.kabir@gmail.com",
      "khalbir@hotmail.com",
    ];

import { DEMO_EMAILS, DEMO_BOOKING_REFS, DEMO_PAYMENT_REFS } from "@/lib/purge-demo-utility";

export async function GET() {
  try {
    // Find all demo mockup users specifically
    const demoUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: DEMO_EMAILS } },
          { email: { contains: "customer@test.com", mode: "insensitive" } },
          { email: { contains: "handyhubpro.com", mode: "insensitive" } },
          { email: { contains: "test.com", mode: "insensitive" } },
          { id: { startsWith: "usr_cust_demo" } },
        ],
      },
      select: { id: true, email: true },
    });

    const demoUserIds = demoUsers.map((u) => u.id);

    // 1. Delete all demo payments
    const deletedPayments = await prisma.payment.deleteMany({
      where: {
        OR: [
          { userId: { in: demoUserIds } },
          { reference: { startsWith: "HHP_BKG_100" } },
        ],
      },
    });

    // 2. Delete all demo reviews
    const deletedReviews = await prisma.review.deleteMany({
      where: {
        OR: [
          { customerId: { in: demoUserIds } },
          { booking: { reference: { startsWith: "BKG-10" } } },
        ],
      },
    });

    // 3. Delete all demo disputes
    const deletedDisputes = await prisma.dispute.deleteMany({
      where: {
        OR: [
          { customerId: { in: demoUserIds } },
          { booking: { reference: { startsWith: "BKG-10" } } },
        ],
      },
    });

    // 4. Delete all demo bookings
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        OR: [
          { customerId: { in: demoUserIds } },
          { reference: { startsWith: "BKG-10" } },
        ],
      },
    });

    // 5. Delete all demo professionals
    const deletedPros = await prisma.professional.deleteMany({
      where: {
        userId: { in: demoUserIds },
      },
    });

    // 6. Delete all demo users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: demoUserIds },
      },
    });

    return NextResponse.json({
      success: true,
      message: "PURGE COMPLETE: All demo mockup records deleted from PostgreSQL database!",
      purged: {
        deletedPayments: deletedPayments.count,
        deletedReviews: deletedReviews.count,
        deletedDisputes: deletedDisputes.count,
        deletedBookings: deletedBookings.count,
        deletedPros: deletedPros.count,
        deletedUsers: deletedUsers.count,
        demoEmailsFound: demoUsers.map((u) => u.email),
      },
    });
  } catch (error: any) {
    console.error("[Purge Demo Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to purge database" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
