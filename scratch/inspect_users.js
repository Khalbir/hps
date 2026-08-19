const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function inspectUsers() {
  console.log("=== Inspecting Users & Roles in DB ===");
  const users = await prisma.user.findMany({
    include: {
      professional: true,
      bookings: { take: 5 },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    console.log(JSON.stringify({
      id: u.id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      hasProProfile: !!u.professional,
      proStatus: u.professional?.verificationStatus,
      bookingCount: u.bookings.length,
      createdAt: u.createdAt,
    }, null, 2));
  }
}

inspectUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
