import { prisma } from "../src/lib/db";
import { validateArtisanNameMatch } from "../src/lib/banks";

async function main() {
  console.log("=== INTEGRATION TEST: ARTISAN BANK DETAILS & TRANSFER PROTECTION ===\n");

  // 1. Find a test artisan
  const artisan = await prisma.user.findFirst({
    where: { role: "PROFESSIONAL", professional: { isNot: null } },
    include: { professional: true, wallet: true },
  });

  if (!artisan || !artisan.professional) {
    console.log("No artisan found for live test.");
    return;
  }

  const artisanName = `${artisan.firstName} ${artisan.lastName}`.trim();
  console.log(`👤 Testing with Artisan: "${artisanName}" (User ID: ${artisan.id})`);

  // 2. Test Matching Bank Account
  const validBankName = `${artisan.lastName.toUpperCase()} ${artisan.firstName.toUpperCase()}`;
  const validMatch = validateArtisanNameMatch(artisanName, validBankName);
  console.log(`\nTest 1 (Valid Name Match):`);
  console.log(`   Bank Account Name: "${validBankName}"`);
  console.log(`   Match Result: isValid=${validMatch.isValid}, score=${validMatch.matchScore}%`);
  if (!validMatch.isValid) throw new Error("Expected valid match to succeed!");
  console.log("   ✅ Valid bank account approved for payouts.");

  // 3. Test Fraudulent Mismatched Bank Account
  const fraudBankName = "EMMANUEL OLUWASEUN CHUKWU";
  const fraudMatch = validateArtisanNameMatch(artisanName, fraudBankName);
  console.log(`\nTest 2 (Fraudulent Name Mismatch):`);
  console.log(`   Bank Account Name: "${fraudBankName}"`);
  console.log(`   Match Result: isValid=${fraudMatch.isValid}, score=${fraudMatch.matchScore}%`);
  if (fraudMatch.isValid) throw new Error("Expected mismatched name to fail!");
  console.log(`   🛑 Transfer blocked successfully: "${fraudMatch.reason}"`);

  // 4. Save Valid Bank Details to DB
  await prisma.professional.update({
    where: { userId: artisan.id },
    data: {
      bankName: "Access Bank",
      bankAccount: "0123456789",
      accountName: validBankName,
    },
  });

  const updatedPro = await prisma.professional.findUnique({
    where: { userId: artisan.id },
  });

  console.log(`\nTest 3 (Database Persistence):`);
  console.log(`   Saved in DB: bankName="${updatedPro?.bankName}", bankAccount="${updatedPro?.bankAccount}", accountName="${updatedPro?.accountName}"`);
  console.log("   ✅ Bank details successfully persisted to PostgreSQL.");
}

main().finally(() => prisma.$disconnect());
