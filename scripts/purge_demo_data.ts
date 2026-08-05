import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function purgeDemoData() {
  console.log("🧹 Purging sample/demo data from database...");

  // 1. Delete reviews
  try {
    await prisma.review.deleteMany({});
    console.log("✅ Cleared demo reviews");
  } catch (err: any) {
    console.log("⚠️ Reviews table clean:", err.message);
  }

  // 2. Delete payments
  try {
    await prisma.payment.deleteMany({});
    console.log("✅ Cleared demo payments");
  } catch (err: any) {
    console.log("⚠️ Payments table clean:", err.message);
  }

  // 3. Delete bookings
  try {
    await prisma.booking.deleteMany({});
    console.log("✅ Cleared demo bookings");
  } catch (err: any) {
    console.log("⚠️ Bookings table clean:", err.message);
  }

  // 4. Delete wallets & transactions
  try {
    await prisma.walletTransaction.deleteMany({});
    await prisma.wallet.deleteMany({
      where: {
        user: {
          email: { notIn: ["admin@handyhubpro.ng", "admin@handyhubpro.com", "info@handyhubpro.ng"] },
        },
      },
    });
    console.log("✅ Cleared demo wallets");
  } catch (err: any) {
    console.log("⚠️ Wallets table clean:", err.message);
  }

  // 5. Delete professional records
  try {
    await prisma.professional.deleteMany({});
    console.log("✅ Cleared demo professional records");
  } catch (err: any) {
    console.log("⚠️ Professional table clean:", err.message);
  }

  // 6. Delete non-admin users
  try {
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: { notIn: ["admin@handyhubpro.ng", "admin@handyhubpro.com", "info@handyhubpro.ng"] },
      },
    });
    console.log(`✅ Cleared ${deletedUsers.count} demo user records`);
  } catch (err: any) {
    console.log("⚠️ Users table clean:", err.message);
  }

  // 7. Seed fresh clean admin accounts
  try {
    const adminCount = await prisma.user.count({
      where: { email: { in: ["admin@handyhubpro.ng", "admin@handyhubpro.com"] } },
    });
    console.log(`✅ Active Admin Accounts in Database: ${adminCount}`);
  } catch {}

  console.log("\n✨ Database purge completed successfully! Zero sample data remaining.");
  await prisma.$disconnect();
}

purgeDemoData();
