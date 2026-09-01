import { calculateJobPrice, DEFAULT_PRICING_RULES } from "../src/lib/pricingEngine";
import { SERVICE_CATEGORIES } from "../src/lib/services";

console.log("=== TESTING CLEANING DEFAULTS & NAME ===");

const cleaningCat = SERVICE_CATEGORIES.find((c) => c.id === "cleaning");
console.log("Cleaning Category Services:", cleaningCat?.services.map(s => ({ id: s.id, name: s.name, price: s.price })));

const defaultCleaning = calculateJobPrice({
  serviceId: "residential-cleaning",
  pricingModel: "PROPERTY_BASED",
  basePrice: 15000,
  plan: "SILVER",
  // No bedrooms/bathrooms/isFurnished/dirtLevel passed to test default resolution:
}, DEFAULT_PRICING_RULES);

console.log("\nDefault One-Time Cleaning Price (2 Bed, 1 Bath, Furnished, Moderate):");
console.log("Total:", defaultCleaning.totalPriceNgn);
console.log("Breakdown:", defaultCleaning.breakdown);
