import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function purge() {
  console.log("🧹 Purging demo mockup data from Supabase database...");

  const demoEmails = [
    "abubakar@handyhubpro.com",
    "blessing@handyhubpro.com",
    "grace@handyhubpro.com",
    "usman@handyhubpro.com",
    "audu@test.com",
    "sarah@test.com",
    "ibrahim@test.com",
    "emeka@test.com",
    "artisan@handyhubpro.ng",
  ];

  const demoBookingRefs = [
    "BKG-10293",
    "BKG-10344",
    "BKG-10392",
    "BKG-10412",
    "demo_booking_101",
  ];

  const demoPaymentRefs = [
    "HHP_BKG_100293_17820",
    "HHP_BKG_100344_17835",
    "HHP_BKG_100392_17840",
    "HHP_BKG_100412_17855",
  ];

  // 1. Delete Demo Payments
  const deletedPayments = await prisma.payment.deleteMany({
    where: {
      OR: [
        { reference: { in: demoPaymentRefs } },
        { user: { email: { in: demoEmails } } },
      ],
    },
  });

  // 2. Delete Demo Reviews
  const deletedReviews = await prisma.review.deleteMany({
    where: {
      OR: [
        { customer: { email: { in: demoEmails } } },
        { booking: { reference: { in: demoBookingRefs } } },
      ],
    },
  });

  // 3. Delete Demo Disputes
  const deletedDisputes = await prisma.dispute.deleteMany({
    where: {
      OR: [
        { customer: { email: { in: demoEmails } } },
        { booking: { reference: { in: demoBookingRefs } } },
      ],
    },
  });

  // 4. Delete Demo Bookings
  const deletedBookings = await prisma.booking.deleteMany({
    where: {
      OR: [
        { reference: { in: demoBookingRefs } },
        { customer: { email: { in: demoEmails } } },
      ],
    },
  });

  // 5. Delete Demo Professionals & Users
  const demoUsers = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);

  const deletedPros = await prisma.professional.deleteMany({
    where: { userId: { in: demoUserIds } },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: demoUserIds } },
  });

  console.log("✅ Purge Completed!");
  console.log({
    deletedPayments: deletedPayments.count,
    deletedReviews: deletedReviews.count,
    deletedDisputes: deletedDisputes.count,
    deletedBookings: deletedBookings.count,
    deletedPros: deletedPros.count,
    deletedUsers: deletedUsers.count,
  });
}

purge()
  .catch((e) => console.error("Purge Error:", e))
  .finally(() => prisma.$disconnect());
