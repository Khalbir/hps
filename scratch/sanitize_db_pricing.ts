import { prisma } from "../src/lib/db";
import { DEFAULT_PRICING_RULES } from "../src/lib/pricingEngine";

async function main() {
  console.log("=== SANITIZING DATABASE PRICING RULES ===");

  const cleanConfig = {
    bedroomAddonNgn: 3000,
    bathroomAddonNgn: 2000,
    furnishedSurchargeNgn: 5000,
    planMultipliers: {
      SILVER: 1.0,
      GOLD: 1.25,
      PLATINUM: 1.5,
    },
    dirtLevelMultipliers: {
      LIGHT: 1.0,
      MODERATE: 1.15,
      HEAVY: 1.35,
    },
    regionalZones: DEFAULT_PRICING_RULES.regionalZones,
    serviceOverrides: {}, // Clean - no overrides so canonical prices are used!
  };

  const jsonString = JSON.stringify(cleanConfig);

  // Update Setting table
  await prisma.setting.upsert({
    where: { key: "pricing_rules_config" },
    update: { value: jsonString },
    create: { key: "pricing_rules_config", value: jsonString },
  });
  console.log("Setting table updated with clean default pricing rules.");

  // Clean obsolete audit logs
  await prisma.auditLog.deleteMany({
    where: { entity: "PRICING_RULES" },
  });
  console.log("Cleared old PRICING_RULES audit logs.");

  // Also verify residential-cleaning service record
  await prisma.service.updateMany({
    where: { slug: "residential-cleaning" },
    data: {
      name: "Cleaning",
      basePrice: 15000,
    }
  });
  console.log("Verified 'residential-cleaning' service in DB has name='Cleaning' and basePrice=15000.");
}

main().finally(() => prisma.$disconnect());
