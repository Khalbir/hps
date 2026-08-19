import { prisma } from "../src/lib/prisma";
import { generateDigitalIdFromSeed } from "../src/lib/digitalId";

async function rectifyUser() {
  console.log("==========================================================");
  console.log("🔧 RECTIFYING USER: firdausiyahaya44@gmail.com -> PROFESSIONAL");
  console.log("==========================================================");

  const email = "firdausiyahaya44@gmail.com";
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { professional: true },
  });

  if (!user) {
    throw new Error(`User with email ${email} not found in database.`);
  }

  console.log(`Found user: ${user.firstName} ${user.lastName} (Current Role: ${user.role})`);

  // 1. Update User role to PROFESSIONAL
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: "PROFESSIONAL",
      isVerified: true,
      isActive: true,
    },
  });

  // 2. Ensure Professional profile exists with Digital ID
  const digitalId = generateDigitalIdFromSeed(user.id);
  const proProfile = await prisma.professional.upsert({
    where: { userId: user.id },
    update: {
      verificationStatus: "VERIFIED",
    },
    create: {
      userId: user.id,
      digitalId,
      bio: "Verified Skilled Artisan / Professional",
      skills: JSON.stringify(["Cleaning", "General Maintenance"]),
      verificationStatus: "VERIFIED",
      rating: 5.0,
      totalJobs: 0,
    },
  });

  // 3. Ensure Escrow Wallet exists
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      balance: 0,
    },
  });

  console.log("\n✅ USER RECTIFICATION COMPLETE:");
  console.log(`  - Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
  console.log(`  - Email: ${updatedUser.email}`);
  console.log(`  - Role: ${updatedUser.role} (Artisan / Professional)`);
  console.log(`  - Digital ID: ${proProfile.digitalId}`);
  console.log(`  - Verification Status: ${proProfile.verificationStatus}`);
  console.log("==========================================================");
}

rectifyUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
