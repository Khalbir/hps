import { prisma } from "../src/lib/db";

async function main() {
  console.log("=== CHECKING SUPABASE DB DIRECTLY ===");

  const allSettings = await prisma.setting.findMany();
  console.log("All Settings in DB:", allSettings);

  const allAudits = await prisma.auditLog.findMany({
    where: { entity: "PRICING_RULES" },
    orderBy: { createdAt: "desc" },
  });
  console.log(`Found ${allAudits.length} PRICING_RULES AuditLogs:`, allAudits);

  const cleaningServices = await prisma.service.findMany({
    where: {
      OR: [
        { slug: "residential-cleaning" },
        { slug: "deep-cleaning" },
        { slug: "routine-cleaning-silver" },
      ]
    }
  });
  console.log("Cleaning Services:", cleaningServices);
}

main().finally(() => prisma.$disconnect());
