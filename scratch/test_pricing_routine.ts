import { calculateJobPrice, DEFAULT_PRICING_RULES } from "../src/lib/pricingEngine";

console.log("=== TESTING ROUTINE CLEANING PROPERTY SIZE CONFIGURATION ===");

const testCases = [
  { name: "Silver 1 Bed, 1 Bath", serviceId: "routine-cleaning-silver", bedrooms: 1, bathrooms: 1 },
  { name: "Silver 2 Bed, 1 Bath (+25%)", serviceId: "routine-cleaning-silver", bedrooms: 2, bathrooms: 1 },
  { name: "Silver 3 Bed, 1 Bath (+50%)", serviceId: "routine-cleaning-silver", bedrooms: 3, bathrooms: 1 },
  { name: "Silver 3 Bed, 2 Bath (+50% bed, +5% bath)", serviceId: "routine-cleaning-silver", bedrooms: 3, bathrooms: 2 },
  { name: "Gold 1 Bed, 1 Bath", serviceId: "routine-cleaning-gold", bedrooms: 1, bathrooms: 1 },
  { name: "Gold 3 Bed, 2 Bath (+50% bed, +5% bath)", serviceId: "routine-cleaning-gold", bedrooms: 3, bathrooms: 2 },
  { name: "Platinum 1 Bed, 1 Bath", serviceId: "routine-cleaning-platinum", bedrooms: 1, bathrooms: 1 },
  { name: "Platinum 3 Bed, 2 Bath (+50% bed, +5% bath)", serviceId: "routine-cleaning-platinum", bedrooms: 3, bathrooms: 2 },
];

for (const tc of testCases) {
  const result = calculateJobPrice({
    serviceId: tc.serviceId,
    pricingModel: "SUBSCRIPTION",
    basePrice: tc.serviceId.includes("silver") ? 45000 : tc.serviceId.includes("gold") ? 56250 : 67500,
    plan: tc.serviceId.includes("silver") ? "SILVER" : tc.serviceId.includes("gold") ? "GOLD" : "PLATINUM",
    bedrooms: tc.bedrooms,
    bathrooms: tc.bathrooms,
    regionalZoneId: "abuja-suburbs",
  }, DEFAULT_PRICING_RULES);

  console.log(`\n--- ${tc.name} ---`);
  console.log(`Total Price: ₦${result.totalPriceNgn.toLocaleString()}`);
  console.log("Breakdown:", result.breakdown);
}
