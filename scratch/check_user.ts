import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: "firdausiyahaya", mode: "insensitive" } },
    include: { professional: true },
  });
  console.log("USER IN DB:", JSON.stringify(user, null, 2));

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log("RECENT USERS:", JSON.stringify(allUsers, null, 2));
}

main().finally(() => prisma.$disconnect());
