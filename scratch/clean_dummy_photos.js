const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const bookings = await prisma.booking.findMany();
  for (const b of bookings) {
    let before = b.beforePhotos;
    let after = b.afterPhotos;
    let modified = false;

    if (before && before.includes('before_sample.jpg')) {
      before = '[]';
      modified = true;
    }
    if (after && after.includes('after_sample.jpg')) {
      after = '[]';
      modified = true;
    }

    if (modified) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { beforePhotos: before, afterPhotos: after }
      });
      console.log(`Cleaned dummy photos for booking ${b.reference}`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
