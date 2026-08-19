const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Testing rating transcription...");

  // Find Khalid Kabir
  let pro = await prisma.professional.findFirst({
    where: { user: { email: { contains: "khaleid" } } },
    include: { user: true },
  });

  if (!pro) {
    pro = await prisma.professional.findFirst({
      include: { user: true },
    });
  }

  if (!pro) {
    console.log("No pro found.");
    return;
  }

  console.log(`Found pro: ${pro.user?.firstName} ${pro.user?.lastName} (ID: ${pro.id}, Current Rating: ${pro.rating})`);

  // Find a booking for this pro
  const booking = await prisma.booking.findFirst({
    where: { professionalId: pro.id },
    include: { customer: true },
  });

  if (!booking) {
    console.log("No booking found for this pro.");
    return;
  }

  console.log(`Found booking: ${booking.reference} by customer ${booking.customer?.firstName}`);

  // Check existing reviews
  const existingReviews = await prisma.review.findMany({
    where: { professionalId: pro.id },
  });

  console.log(`Current reviews for pro: ${existingReviews.length}`);
  existingReviews.forEach(r => console.log(` - ${r.rating}★: ${r.comment}`));

  console.log("\nSimulating client submitting 5-star review...");
  const newRating = 5;
  const comment = "Exceptional and meticulous work! Very punctual and professional.";

  // Upsert review
  const existing = await prisma.review.findFirst({
    where: { bookingId: booking.id, customerId: booking.customerId },
  });

  let review;
  if (existing) {
    review = await prisma.review.update({
      where: { id: existing.id },
      data: { rating: newRating, comment },
    });
  } else {
    review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        professionalId: pro.id,
        rating: newRating,
        comment,
      },
    });
  }

  // Recalculate average
  const allReviews = await prisma.review.findMany({
    where: { professionalId: pro.id },
    select: { rating: true },
  });

  const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = Number((sum / allReviews.length).toFixed(1));

  const updatedPro = await prisma.professional.update({
    where: { id: pro.id },
    data: { rating: avgRating, totalJobs: Math.max(pro.totalJobs, 1) },
  });

  console.log(`✅ Success! Updated Pro Rating: ${updatedPro.rating}★ across ${allReviews.length} verified reviews.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
