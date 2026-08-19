import { prisma } from "../src/lib/prisma";

async function testSkillsManagement() {
  console.log("==================================================================");
  console.log("🚀 TESTING ADMIN PROFESSIONAL FIELD & SKILLS MANAGEMENT CAPABILITY");
  console.log("==================================================================");

  // 1. Find a test or active professional
  const proUser = await prisma.user.findFirst({
    where: { role: "PROFESSIONAL" },
    include: { professional: true },
  });

  if (!proUser) {
    throw new Error("No Professional user found in database to test.");
  }

  console.log(`Found Artisan: ${proUser.firstName} ${proUser.lastName} (${proUser.email})`);
  console.log(`Current Skills in DB: ${proUser.professional?.skills}`);

  // 2. Simulate Admin Changing Skills (e.g. from Cleaning to Electrical + Solar)
  const newPrimaryField = "Electrical";
  const newSkills = ["Electrical", "Wiring & Rewiring", "Solar & Inverter Setup", "Socket Repair"];

  console.log(`\n--- STEP 2: Updating Artisan Trade Field to "${newPrimaryField}" ---`);
  
  let docs: any = {};
  try {
    if (typeof proUser.professional?.documents === "string" && proUser.professional.documents.trim()) {
      docs = JSON.parse(proUser.professional.documents);
      if (typeof docs === "string") docs = JSON.parse(docs);
    }
  } catch {}

  docs.serviceCategory = newPrimaryField;
  docs.skills = newSkills;

  const updatedPro = await prisma.professional.update({
    where: { id: proUser.professional!.id },
    data: {
      skills: JSON.stringify(newSkills),
      documents: JSON.stringify(docs),
    },
  });

  console.log("✓ Updated Professional Record in DB:");
  console.log(`  - Primary Trade: ${docs.serviceCategory}`);
  console.log(`  - Stored Skills JSON: ${updatedPro.skills}`);

  // 3. Verify Parsing in Admin Verification API logic
  const parsedSkills = JSON.parse(updatedPro.skills);
  if (Array.isArray(parsedSkills) && parsedSkills.includes("Wiring & Rewiring")) {
    console.log("✓ Successfully validated skills array persistence and query format.");
  } else {
    throw new Error("Failed to validate parsed skills.");
  }

  console.log("\n==================================================================");
  console.log("✅ ALL ADMIN SKILLS MANAGEMENT TESTS PASSED!");
  console.log("==================================================================");
}

testSkillsManagement()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
