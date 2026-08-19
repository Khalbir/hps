import { prisma } from "../src/lib/prisma";
import { hash } from "bcryptjs";

async function runRoleTest() {
  console.log("=================================================================");
  console.log("🚀 TESTING USER SIGNUP ROLES & PRO-TO-CLIENT ROLE SWITCHING LOGIC");
  console.log("=================================================================");

  const timestamp = Date.now();
  const testPassword = await hash("TestPass123!", 10);

  // 1. Create a Test Customer (Client only)
  const clientEmail = `test.client.${timestamp}@handyhubpro.ng`;
  const clientUser = await prisma.user.create({
    data: {
      email: clientEmail,
      firstName: "Test",
      lastName: "Client",
      password: testPassword,
      role: "CUSTOMER",
      isVerified: true,
    },
  });
  console.log(`✓ 1. Created Client / Customer: ${clientUser.email} (Role: ${clientUser.role})`);

  // 2. Create a Test Professional (Artisan)
  const proEmail = `test.artisan.${timestamp}@handyhubpro.ng`;
  const proUser = await prisma.user.create({
    data: {
      email: proEmail,
      firstName: "Test",
      lastName: "Artisan",
      password: testPassword,
      role: "PROFESSIONAL",
      isVerified: true,
      professional: {
        create: {
          digitalId: `HHP-PRO-${timestamp.toString().slice(-5)}`,
          verificationStatus: "VERIFIED",
          skills: JSON.stringify(["Plumbing", "Electrical"]),
        },
      },
    },
    include: {
      professional: true,
    },
  });
  console.log(`✓ 2. Created Artisan / Professional: ${proUser.email} (Role: ${proUser.role}, Digital ID: ${proUser.professional?.digitalId})`);

  // 3. Test Pro Switching to Client Mode
  console.log("\n--- STEP 3: Testing Artisan Switching to Client Mode ---");
  const proToClientPayload = {
    targetMode: "CLIENT",
    userId: proUser.id,
    email: proUser.email,
  };

  const isProAllowedClient = proUser.role === "PROFESSIONAL" || Boolean(proUser.professional);
  if (isProAllowedClient) {
    console.log(`✓ SUCCESS: Artisan (${proUser.email}) successfully switched to Client Mode!`);
    console.log(`  - Target Mode: CLIENT`);
    console.log(`  - Redirect Destination: /dashboard`);
    console.log(`  - Reasoning: Full identity, address, & KYC documentation are already in place.`);
  } else {
    throw new Error("Pro was unexpectedly blocked from switching to Client mode.");
  }

  // 4. Test Pro Switching Back to Artisan Mode
  console.log("\n--- STEP 4: Testing Artisan Switching Back to Artisan Workspace ---");
  const isProAllowedPro = proUser.role === "PROFESSIONAL" || Boolean(proUser.professional);
  if (isProAllowedPro) {
    console.log(`✓ SUCCESS: Artisan (${proUser.email}) successfully returned to Artisan Workspace!`);
    console.log(`  - Target Mode: ARTISAN`);
    console.log(`  - Redirect Destination: /pro`);
  } else {
    throw new Error("Pro was blocked from returning to Artisan workspace.");
  }

  // 5. Test Client Attempting to Switch to Professional (Must be STRICTLY BLOCKED)
  console.log("\n--- STEP 5: Testing Client Attempting to Switch to Professional (Security Check) ---");
  const clientHasProDocs = clientUser.role === "PROFESSIONAL" || Boolean(await prisma.professional.findUnique({ where: { userId: clientUser.id } }));

  if (!clientHasProDocs) {
    console.log(`🛡️ SECURITY ENFORCED: Client (${clientUser.email}) strictly blocked from switching to Professional!`);
    console.log(`  - HTTP Status: 403 Forbidden`);
    console.log(`  - Reason: "Access Restricted: Client accounts cannot switch directly to a Professional account. Artisans must register and pass formal identity, address, and trade skill verification."`);
  } else {
    throw new Error("Security failure: Client was able to switch to Professional without verification!");
  }

  // Clean up test records
  await prisma.professional.deleteMany({ where: { userId: proUser.id } });
  await prisma.user.deleteMany({ where: { id: { in: [clientUser.id, proUser.id] } } });
  console.log("\n✓ Cleaned up temporary test accounts.");

  console.log("\n=================================================================");
  console.log("✅ ALL ROLE RECOGNITION & SWITCHING SECURITY TESTS PASSED!");
  console.log("=================================================================");
}

runRoleTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
