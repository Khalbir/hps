import { prisma } from "../src/lib/db";

async function main() {
  const setting = await prisma.setting.findUnique({
    where: { key: "pricing_rules_config" },
  });
  console.log("pricing_rules_config JSON:", JSON.stringify(JSON.parse(setting?.value || "{}"), null, 2));

  const audits = await prisma.auditLog.findMany({
    where: { entity: "PRICING_RULES" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  console.log("Recent AuditLogs for PRICING_RULES:", audits);
}

main().finally(() => prisma.$disconnect());
