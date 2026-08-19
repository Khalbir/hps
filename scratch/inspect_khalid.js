const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function inspectKhalid() {
  const pro = await prisma.professional.findFirst({
    where: { user: { email: "khaleid.kabir@gmail.com" } },
    include: { user: true },
  });

  console.log("Khalid Pro:", JSON.stringify(pro, null, 2));
}

inspectKhalid().finally(() => prisma.$disconnect());
