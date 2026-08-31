import { prisma } from "../src/lib/db";

async function main() {
  const cats = await prisma.serviceCategory.findMany({
    include: { services: true }
  });
  console.log("DB Categories count:", cats.length);
  for (const c of cats) {
    console.log(`- Category [${c.name}] (${c.slug}):`);
    for (const s of c.services) {
      console.log(`    * ${s.name} (${s.slug}) - ₦${s.basePrice}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
