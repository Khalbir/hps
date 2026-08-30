import { prisma } from "@/lib/db";

export const DEMO_EMAILS = [
  "customer@test.com",
  "abubakar@handyhubpro.com",
  "blessing@handyhubpro.com",
  "grace@handyhubpro.com",
  "usman@handyhubpro.com",
  "audu@test.com",
  "sarah@test.com",
  "ibrahim@test.com",
  "emeka@test.com",
  "artisan@handyhubpro.ng",
  "client@handyhubpro.ng",
  "user@test.com",
];

export const DEMO_BOOKING_REFS = [
  "BKG-10293",
  "BKG-10344",
  "BKG-10392",
  "BKG-10412",
  "demo_booking_101",
];

export const DEMO_PAYMENT_REFS = [
  "HHP_BKG_100293_17820",
  "HHP_BKG_100344_17835",
  "HHP_BKG_100392_17840",
  "HHP_BKG_100412_17855",
];

export async function purgeDemoRecordsFromDB() {
  try {
    // Delete payments
    await prisma.payment.deleteMany({
      where: {
        OR: [
          { reference: { in: DEMO_PAYMENT_REFS } },
          { user: { email: { in: DEMO_EMAILS } } },
        ],
      },
    }).catch(() => {});

    // Delete reviews
    await prisma.review.deleteMany({
      where: {
        OR: [
          { customer: { email: { in: DEMO_EMAILS } } },
          { booking: { reference: { in: DEMO_BOOKING_REFS } } },
        ],
      },
    }).catch(() => {});

    // Delete disputes
    await prisma.dispute.deleteMany({
      where: {
        OR: [
          { customer: { email: { in: DEMO_EMAILS } } },
          { booking: { reference: { in: DEMO_BOOKING_REFS } } },
        ],
      },
    }).catch(() => {});

    // Delete bookings
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { reference: { in: DEMO_BOOKING_REFS } },
          { customer: { email: { in: DEMO_EMAILS } } },
        ],
      },
    }).catch(() => {});

    // Delete demo users and pros
    const demoUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: DEMO_EMAILS } },
          { email: { contains: "test.com", mode: "insensitive" } },
          { email: { contains: "handyhubpro.com", mode: "insensitive" } },
          { id: { startsWith: "usr_cust_demo" } },
        ],
      },
      select: { id: true },
    }).catch(() => []);

    const demoUserIds = demoUsers.map((u) => u.id);

    if (demoUserIds.length > 0) {
      await prisma.professional.deleteMany({
        where: { userId: { in: demoUserIds } },
      }).catch(() => {});

      await prisma.user.deleteMany({
        where: { id: { in: demoUserIds } },
      }).catch(() => {});
    }

    // Auto-clear inactive escrows and abandoned records older than 14 days to preserve database storage
    const { autoClearStaleEscrowsFromDB } = await import("@/lib/escrow");
    await autoClearStaleEscrowsFromDB(14).catch(() => {});
  } catch (e) {
    console.warn("[Auto Purge Demo Warning]:", e);
  }
}
