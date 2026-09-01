import { prisma } from "../src/lib/db";

async function main() {
  const setting = await prisma.setting.findUnique({
    where: { key: "pricing_rules_config" },
  });
  console.log("pricing_rules_config:", setting?.value);

  const services = await prisma.service.findMany();
  console.log("Services in DB:", services);
}

main().finally(() => prisma.$disconnect());
