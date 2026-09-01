import { prisma } from "../src/lib/db";

async function main() {
  console.log("Updating Service name for slug 'residential-cleaning' to 'Cleaning'...");

  await prisma.service.updateMany({
    where: { slug: "residential-cleaning" },
    data: {
      name: "Cleaning",
      description: "Standard deep cleaning for apartments and houses",
    },
  });

  console.log("Updated successfully!");
}

main().finally(() => prisma.$disconnect());
