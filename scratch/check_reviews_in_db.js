const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const reviews = await prisma.review.findMany({
    include: {
      booking: {
        include: {
          customer: true,
          service: true,
          professional: {
            include: { user: true }
          }
        }
      }
    }
  });

  console.log("Found reviews count:", reviews.length);
  for (const r of reviews) {
    console.log(`Review ID: ${r.id} | Rating: ${r.rating} | Comment: "${r.comment}" | Pro: ${r.booking?.professional?.user?.firstName || r.professionalId} | Customer: ${r.booking?.customer?.firstName}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
