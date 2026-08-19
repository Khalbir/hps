const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function generateDigitalId(seedId, index) {
  let hash = 0;
  for (let i = 0; i < seedId.length; i++) {
    hash = ((hash << 5) - hash) + seedId.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 89900) + 10000 + (index || 0);
  return `HHP-PRO-${num}`;
}

async function main() {
  console.log("Assigning official HandyHub Digital IDs to all professionals...");

  const pros = await prisma.professional.findMany({
    include: { user: true },
  });

  console.log(`Found ${pros.length} professional records in database.`);

  const assignedIds = new Set();

  for (let i = 0; i < pros.length; i++) {
    const pro = pros[i];
    let digId = pro.digitalId;

    if (!digId) {
      digId = generateDigitalId(pro.id, i);
      while (assignedIds.has(digId)) {
        const rand = Math.floor(10000 + Math.random() * 90000);
        digId = `HHP-PRO-${rand}`;
      }
      assignedIds.add(digId);

      await prisma.professional.update({
        where: { id: pro.id },
        data: { digitalId: digId },
      });
      console.log(`Assigned Digital ID ${digId} to Pro: ${pro.user?.firstName} ${pro.user?.lastName} (${pro.user?.email})`);
    } else {
      assignedIds.add(digId);
      console.log(`Pro ${pro.user?.firstName} ${pro.user?.lastName} already has Digital ID: ${digId}`);
    }
  }

  console.log("\nAll professionals now have verified HandyHub Digital IDs!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
