const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== Testing Pro Notification & Job Acceptance Engine ===");

  // 1. Find a verified pro
  const pro = await prisma.professional.findFirst({
    where: { verificationStatus: "VERIFIED" },
    include: { user: true },
  });

  if (!pro) {
    console.log("No verified pro found for testing.");
    return;
  }

  console.log(`Found Pro: ${pro.user.firstName} ${pro.user.lastName} (User ID: ${pro.userId}, Pro ID: ${pro.id})`);

  // 2. Create a test notification in DB for pro.userId
  const notif = await prisma.notification.create({
    data: {
      userId: pro.userId,
      type: "BOOKING",
      title: "Artisan Partner Matched & Assigned 👨‍🔧",
      message: "New Job Assigned! You have been assigned to booking #TEST_NOTIF_123 for Cleaning (₦25,000). Check job details to accept.",
      data: JSON.stringify({
        "Booking Reference": "#TEST_NOTIF_123",
        Service: "Residential Cleaning",
        "Job Price": "₦25,000",
        "Job Action": "ACCEPT_REQUIRED",
      }),
    },
  });

  console.log("✅ Successfully created in-app notification:", notif.id);

  // 3. Query notifications via userId
  const proNotifs = await prisma.notification.findMany({
    where: { userId: pro.userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log(`✅ Fetched ${proNotifs.length} notifications for pro userId (${pro.userId}):`);
  proNotifs.forEach((n, idx) => {
    console.log(`  [${idx + 1}] ${n.title} - Read: ${n.isRead} - ${n.createdAt.toISOString()}`);
  });

  console.log("=== All Tests Succeeded! ===");
}

main()
  .catch((err) => {
    console.error("Test Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
