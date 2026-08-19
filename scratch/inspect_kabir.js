const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function inspectKabir() {
  console.log("=== Inspecting Kabir Jauro User Record ===");
  const user = await prisma.user.findUnique({
    where: { email: "kabirbjauro@gmail.com" },
    include: {
      professional: true,
      bookings: {
        include: {
          service: true,
          professional: { include: { user: true } },
        },
      },
    },
  });

  console.log("User:", JSON.stringify(user, null, 2));
}

inspectKabir()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
