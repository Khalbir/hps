import { calculateJobPrice, DEFAULT_PRICING_RULES } from "../src/lib/pricingEngine";

console.log("=== VERIFYING COMPLETE INDEPENDENCE OF ALL SERVICE CARDS ===\n");

// 1. Routine Cleaning Silver
const routineSilver = calculateJobPrice({
  serviceId: "routine-cleaning-silver",
  pricingModel: "SUBSCRIPTION",
  basePrice: 45000,
  plan: "SILVER",
  bedrooms: 3,
  bathrooms: 1,
  regionalZoneId: "abuja-suburbs",
}, DEFAULT_PRICING_RULES);

console.log("1. Routine Cleaning Silver (3 Bed, 1 Bath):");
console.log("Total:", routineSilver.totalPriceNgn);
console.log("Breakdown:", routineSilver.breakdown);

// 2. Routine Cleaning Gold
const routineGold = calculateJobPrice({
  serviceId: "routine-cleaning-gold",
  pricingModel: "SUBSCRIPTION",
  basePrice: 56250,
  plan: "GOLD",
  bedrooms: 3,
  bathrooms: 1,
  regionalZoneId: "abuja-suburbs",
}, DEFAULT_PRICING_RULES);

console.log("\n2. Routine Cleaning Gold (3 Bed, 1 Bath):");
console.log("Total:", routineGold.totalPriceNgn);
console.log("Breakdown:", routineGold.breakdown);

// 3. Residential Deep Cleaning (One-Time)
const oneTimeCleaning = calculateJobPrice({
  serviceId: "residential-cleaning",
  pricingModel: "PROPERTY_BASED",
  basePrice: 15000,
  plan: "SILVER",
  bedrooms: 3,
  bathrooms: 1,
  isFurnished: false,
  dirtLevel: "MODERATE",
  regionalZoneId: "abuja-suburbs",
}, DEFAULT_PRICING_RULES);

console.log("\n3. Residential Deep Cleaning (One-Time) (3 Bed, 1 Bath, Unfurnished, Moderate):");
console.log("Total:", oneTimeCleaning.totalPriceNgn);
console.log("Breakdown:", oneTimeCleaning.breakdown);

// 4. Full Flat Deep Scrub (One-Time)
const deepScrub = calculateJobPrice({
  serviceId: "deep-cleaning",
  pricingModel: "PROPERTY_BASED",
  basePrice: 25000,
  plan: "SILVER",
  bedrooms: 3,
  bathrooms: 1,
  isFurnished: false,
  dirtLevel: "MODERATE",
  regionalZoneId: "abuja-suburbs",
}, DEFAULT_PRICING_RULES);

console.log("\n4. Full Flat Deep Scrub (3 Bed, 1 Bath, Unfurnished, Moderate):");
console.log("Total:", deepScrub.totalPriceNgn);
console.log("Breakdown:", deepScrub.breakdown);
