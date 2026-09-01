import { prisma } from "../src/lib/db";
import { DEFAULT_PRICING_RULES } from "../src/lib/pricingEngine";

async function main() {
  console.log("Resetting DB pricing_rules_config to clean defaults...");

  const cleanRules = {
    ...DEFAULT_PRICING_RULES,
    bedroomAddonNgn: 3000,
    bathroomAddonNgn: 2000,
    furnishedSurchargeNgn: 5000,
    serviceOverrides: {
      "commercial-fumigation": { pricingModel: "CUSTOM_QUOTE" },
      "post-construction": { pricingModel: "CUSTOM_QUOTE" },
      "termite-control": { pricingModel: "CUSTOM_QUOTE" },
      "wiring-rewiring": { pricingModel: "CUSTOM_QUOTE" },
      "exterior-painting": { pricingModel: "CUSTOM_QUOTE" },
      "landscaping-tree-felling": { pricingModel: "CUSTOM_QUOTE" },
    }
  };

  const jsonString = JSON.stringify(cleanRules);

  await prisma.setting.upsert({
    where: { key: "pricing_rules_config" },
    update: { value: jsonString },
    create: { key: "pricing_rules_config", value: jsonString },
  });

  console.log("DB pricing_rules_config reset successfully!");
}

main().finally(() => prisma.$disconnect());
