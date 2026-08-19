const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const bookings = await prisma.booking.findMany({
    select: { id: true, reference: true, status: true, beforePhotos: true, afterPhotos: true }
  });
  console.log("Bookings count:", bookings.length);
  for (const b of bookings) {
    console.log(`Ref: ${b.reference} | Status: ${b.status} | Before: ${b.beforePhotos} | After: ${b.afterPhotos}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
