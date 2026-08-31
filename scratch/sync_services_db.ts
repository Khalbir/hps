import { prisma } from "../src/lib/db";
import { SERVICE_CATEGORIES } from "../src/lib/services";

async function main() {
  console.log("Synchronizing database services with SERVICE_CATEGORIES...");

  for (const cat of SERVICE_CATEGORIES) {
    const dbCat = await prisma.serviceCategory.upsert({
      where: { slug: cat.id },
      update: {
        name: cat.name,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.id,
        isActive: true,
      },
    });

    for (const svc of cat.services) {
      await prisma.service.upsert({
        where: { slug: svc.id },
        update: {
          name: svc.name,
          description: svc.desc,
          basePrice: svc.price,
          priceUnit: svc.unitLabel || (svc.pricingModel === "SUBSCRIPTION" ? "per month" : "per service"),
          categoryId: dbCat.id,
          isActive: true,
        },
        create: {
          name: svc.name,
          slug: svc.id,
          description: svc.desc,
          basePrice: svc.price,
          priceUnit: svc.unitLabel || (svc.pricingModel === "SUBSCRIPTION" ? "per month" : "per service"),
          categoryId: dbCat.id,
          isActive: true,
        },
      });
      console.log(`  + Upserted service: ${svc.name} (${svc.id}) under [${cat.name}]`);
    }
  }

  console.log("Database services synchronized successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
