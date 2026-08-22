import {
  calculateJobPrice,
  DEFAULT_PRICING_RULES,
  PricingRulesConfig,
  SERVICE_PLANS,
  ServicePlanTier,
  getEffectiveServiceItem,
} from "../src/lib/pricingEngine";

async function runPricingEngineTestSuite() {
  console.log("==================================================================");
  console.log("HANDYHUB PRO SOLUTIONS — ENTERPRISE MODULAR PRICING ENGINE TEST SUITE");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || "");
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST GROUP 1: Order of Operations & Room/Bathroom Add-ons Before Multipliers
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 1]: Order of Operations — Aggregating Room/Bathroom Charges Before Multipliers");

    // Base deep cleaning: 25,000 NGN
    // 3 Bedrooms: 1 base + 2 extra bedrooms @ 3,000 = 6,000 NGN
    // 2 Bathrooms: 1 base + 1 extra bathroom @ 2,000 = 2,000 NGN
    // Furnished: 5,000 NGN
    // Aggregate Room Subtotal = 25,000 + 6,000 + 2,000 + 5,000 = 38,000 NGN
    // Silver Plan (1.0x) + Light Condition (1.0x) + Abuja Suburbs (0%) = 38,000 NGN
    const prop1 = calculateJobPrice({
      serviceId: "deep-cleaning",
      pricingModel: "PROPERTY_BASED",
      basePrice: 25000,
      plan: "SILVER",
      bedrooms: 3,
      bathrooms: 2,
      isFurnished: true,
      dirtLevel: "LIGHT",
      regionalZoneId: "abuja-suburbs", // 0%
      isExpressSchedule: false,
    });

    assert(prop1.rawRoomsSubtotalNgn === 38000, "Aggregate Room Subtotal equals ₦38,000 (Base 25k + 2 Beds 6k + 1 Bath 2k + Furnished 5k)");
    assert(prop1.planAdditionNgn === 0, "Silver Plan adds ₦0 plan surcharge (1.0x multiplier)");
    assert(prop1.conditionAdditionNgn === 0, "Light condition adds ₦0 grime surcharge (1.0x multiplier)");
    assert(prop1.totalPriceNgn === 38000, "Silver Light Suburbs Total equals exactly ₦38,000");

    // Gold Plan (1.25x) applied to 38,000 NGN
    // Plan addition = 38,000 * 0.25 = 9,500 NGN => Subtotal = 47,500 NGN
    // Light Condition (1.0x) => Total = 47,500 NGN
    const propGold = calculateJobPrice({
      serviceId: "deep-cleaning",
      pricingModel: "PROPERTY_BASED",
      basePrice: 25000,
      plan: "GOLD",
      bedrooms: 3,
      bathrooms: 2,
      isFurnished: true,
      dirtLevel: "LIGHT",
      regionalZoneId: "abuja-suburbs",
      isExpressSchedule: false,
    });

    assert(propGold.planAdditionNgn === 9500, "Gold Plan correctly adds 25% on top of full room subtotal (+₦9,500 on ₦38,000)");
    assert(propGold.totalPriceNgn === 47500, "Gold Plan total equals ₦47,500 (38,000 × 1.25)");

    // Platinum Plan (1.50x) applied to 38,000 NGN
    // Plan addition = 38,000 * 0.50 = 19,000 NGN => Subtotal = 57,000 NGN
    const propPlat = calculateJobPrice({
      serviceId: "deep-cleaning",
      pricingModel: "PROPERTY_BASED",
      basePrice: 25000,
      plan: "PLATINUM",
      bedrooms: 3,
      bathrooms: 2,
      isFurnished: true,
      dirtLevel: "LIGHT",
      regionalZoneId: "abuja-suburbs",
      isExpressSchedule: false,
    });

    assert(propPlat.planAdditionNgn === 19000, "Platinum Plan correctly adds 50% on top of full room subtotal (+₦19,000 on ₦38,000)");
    assert(propPlat.totalPriceNgn === 57000, "Platinum Plan total equals ₦57,000 (38,000 × 1.50)");

    // -------------------------------------------------------------
    // TEST GROUP 2: Compound Multipliers (Plan Multiplier × Condition Multiplier)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 2]: Compound Multipliers (Plan Multiplier × Condition Multiplier)");

    // Aggregate Room Subtotal = 38,000 NGN
    // Gold Plan (1.25x) = 47,500 NGN
    // Moderate Condition (+15%) on 47,500 NGN = 47,500 * 0.15 = 7,125 NGN
    // Options Subtotal = 47,500 + 7,125 = 54,625 NGN
    const propGoldMod = calculateJobPrice({
      serviceId: "deep-cleaning",
      pricingModel: "PROPERTY_BASED",
      basePrice: 25000,
      plan: "GOLD",
      bedrooms: 3,
      bathrooms: 2,
      isFurnished: true,
      dirtLevel: "MODERATE", // 1.15x
      regionalZoneId: "abuja-suburbs",
      isExpressSchedule: false,
    });

    assert(propGoldMod.conditionAdditionNgn === 7125, "Moderate condition correctly adds 15% on top of Gold plan subtotal (+₦7,125)");
    assert(propGoldMod.totalPriceNgn === 54625, "Compound Gold + Moderate Suburbs Total equals ₦54,625");

    // Platinum Plan (1.50x) on 38,000 = 57,000 NGN
    // Heavy Condition (+35%) on 57,000 NGN = 57,000 * 0.35 = 19,950 NGN
    // Options Subtotal = 57,000 + 19,950 = 76,950 NGN
    const propPlatHeavy = calculateJobPrice({
      serviceId: "deep-cleaning",
      pricingModel: "PROPERTY_BASED",
      basePrice: 25000,
      plan: "PLATINUM",
      bedrooms: 3,
      bathrooms: 2,
      isFurnished: true,
      dirtLevel: "HEAVY", // 1.35x
      regionalZoneId: "abuja-suburbs",
      isExpressSchedule: false,
    });

    assert(propPlatHeavy.conditionAdditionNgn === 19950, "Heavy condition correctly adds 35% on top of Platinum plan subtotal (+₦19,950)");
    assert(propPlatHeavy.totalPriceNgn === 76950, "Compound Platinum + Heavy Suburbs Total equals ₦76,950");

    // -------------------------------------------------------------
    // TEST GROUP 3: Regional Surcharges & Express Dispatch Modifiers
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 3]: Regional Surcharges & Express Priority Dispatch");

    // Subtotal = 54,625 NGN
    // Lagos Island (+20%) = 54,625 * 0.20 = 10,925 NGN
    // Total prior to Express = 65,550 NGN
    const propLagos = calculateJobPrice({
      serviceId: "deep-cleaning",
      pricingModel: "PROPERTY_BASED",
      basePrice: 25000,
      plan: "GOLD",
      bedrooms: 3,
      bathrooms: 2,
      isFurnished: true,
      dirtLevel: "MODERATE",
      regionalZoneId: "lagos-island", // +20%
      isExpressSchedule: false,
    });

    assert(propLagos.regionalSurchargeNgn === 10925, "Lagos Island correctly adds +20% regional surcharge (₦10,925)");
    assert(propLagos.totalPriceNgn === 65550, "Total with Lagos Island surcharge equals ₦65,550");

    // Same + Express Dispatch (+50%) on (54,625 + 10,925 = 65,550) = 32,775 NGN
    // Total = 65,550 + 32,775 = 98,325 NGN
    const propLagosExpress = calculateJobPrice({
      serviceId: "deep-cleaning",
      pricingModel: "PROPERTY_BASED",
      basePrice: 25000,
      plan: "GOLD",
      bedrooms: 3,
      bathrooms: 2,
      isFurnished: true,
      dirtLevel: "MODERATE",
      regionalZoneId: "lagos-island",
      isExpressSchedule: true,
    });

    assert(propLagosExpress.expressSurchargeNgn === 32775, "Express dispatch (+50%) calculates ₦32,775");
    assert(propLagosExpress.totalPriceNgn === 98325, "Total with Lagos Island + Express Dispatch equals ₦98,325");

    // -------------------------------------------------------------
    // TEST GROUP 4: Full Multi-Model Support (Fixed, Quantity, Subscription, Custom Quote)
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 4]: Full Model Support (Fixed, Quantity, Subscription, Custom Quote)");

    // 4A: FIXED Model (e.g. Pipe Repairs 15,000 NGN)
    const fixedSilver = calculateJobPrice({
      serviceId: "pipe-repairs",
      pricingModel: "FIXED",
      basePrice: 15000,
      plan: "SILVER",
    });
    assert(fixedSilver.totalPriceNgn === 15000, "Fixed Price Silver equals ₦15,000");

    const fixedGold = calculateJobPrice({
      serviceId: "pipe-repairs",
      pricingModel: "FIXED",
      basePrice: 15000,
      plan: "GOLD", // 1.25x
    });
    assert(fixedGold.totalPriceNgn === 18750, "Fixed Price Gold equals ₦18,750 (15,000 × 1.25)");

    // 4B: QUANTITY_BASED Model (e.g. AC Servicing 8,000 NGN × 3 units = 24,000 NGN)
    const qtySilver = calculateJobPrice({
      serviceId: "ac-servicing",
      pricingModel: "QUANTITY_BASED",
      basePrice: 8000,
      quantity: 3,
      plan: "SILVER",
    });
    assert(qtySilver.totalPriceNgn === 24000, "Quantity (3 ACs @ ₦8k) Silver equals ₦24,000");

    const qtyGold = calculateJobPrice({
      serviceId: "ac-servicing",
      pricingModel: "QUANTITY_BASED",
      basePrice: 8000,
      quantity: 3,
      plan: "GOLD", // 1.25x => 24,000 × 1.25 = 30,000
    });
    assert(qtyGold.totalPriceNgn === 30000, "Quantity (3 ACs @ ₦8k) Gold equals ₦30,000");

    // 4C: SUBSCRIPTION Model (e.g. Monthly Gardening 35,000 NGN)
    const subSilver = calculateJobPrice({
      serviceId: "gardening-monthly",
      pricingModel: "SUBSCRIPTION",
      basePrice: 35000,
      plan: "SILVER",
    });
    assert(subSilver.totalPriceNgn === 35000, "Monthly Subscription Silver equals ₦35,000/mo");

    // 4D: CUSTOM_QUOTE Model (e.g. Full Renovation 0 NGN upfront)
    const customQuote = calculateJobPrice({
      serviceId: "home-renovation",
      pricingModel: "CUSTOM_QUOTE",
      basePrice: 0,
      plan: "PLATINUM",
    });
    assert(customQuote.totalPriceNgn === 0 && customQuote.isCustomQuote === true, "Custom Quote resolves to ₦0 free upfront inspection");

    // -------------------------------------------------------------
    // TEST GROUP 5: Dynamic Super Admin Rule Overrides & Persistence
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 5]: Dynamic Super Admin Custom Rule Matrix Overrides");

    const customAdminRules: PricingRulesConfig = {
      ...DEFAULT_PRICING_RULES,
      bedroomAddonNgn: 5000, // modified from 3,000
      bathroomAddonNgn: 4000, // modified from 2,000
      planMultipliers: {
        SILVER: 1.0,
        GOLD: 1.30, // modified from 1.25
        PLATINUM: 1.60, // modified from 1.50
      },
      serviceOverrides: {
        "deep-cleaning": {
          basePrice: 30000, // overridden from 25,000
        },
      },
    };

    // Deep cleaning with custom rules:
    // Base Price = 30,000
    // 2 Bedrooms: 1 extra @ 5,000 = 5,000
    // 2 Bathrooms: 1 extra @ 4,000 = 4,000
    // Unfurnished = 0
    // Aggregate Room Subtotal = 30,000 + 5,000 + 4,000 = 39,000 NGN
    // Gold Plan (1.30x) = 39,000 * 1.30 = 50,700 NGN
    const customCalc = calculateJobPrice(
      {
        serviceId: "deep-cleaning",
        pricingModel: "PROPERTY_BASED",
        basePrice: 25000, // original catalog price, should be overridden by 30,000
        plan: "GOLD",
        bedrooms: 2,
        bathrooms: 2,
        isFurnished: false,
        dirtLevel: "LIGHT",
        regionalZoneId: "abuja-suburbs",
      },
      customAdminRules
    );

    assert(customCalc.baseServicePrice === 30000, "Dynamic Service Override base price ₦30,000 applied successfully");
    assert(customCalc.rawRoomsSubtotalNgn === 39000, "Dynamic bedroom (₦5k) and bathroom (₦4k) rates applied correctly (₦39,000)");
    assert(customCalc.planAdditionNgn === 11700, "Dynamic Gold Multiplier (1.30x) adds +₦11,700");
    assert(customCalc.totalPriceNgn === 50700, "Custom Admin Rules Total equals ₦50,700");

    // -------------------------------------------------------------
    // TEST GROUP 6: Financial Reconciliation & Itemized Breakdown Verification
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 6]: Financial Reconciliation & Escrow Breakdown");

    const sampleJob = calculateJobPrice({
      serviceId: "residential-cleaning",
      pricingModel: "PROPERTY_BASED",
      basePrice: 15000,
      plan: "PLATINUM",
      bedrooms: 4, // 3 extra @ 3,000 = 9,000
      bathrooms: 3, // 2 extra @ 2,000 = 4,000
      isFurnished: true, // 5,000
      dirtLevel: "MODERATE", // 1.15x
      regionalZoneId: "abuja-central", // +15%
      isExpressSchedule: true, // +50%
    });

    // 15k + 9k + 4k + 5k = 33,000 NGN
    // Plat (1.50x) => 33,000 + 16,500 = 49,500 NGN
    // Mod (1.15x) => 49,500 + 7,425 = 56,925 NGN
    // Abuja Central (+15%) => 56,925 + 8,539 = 65,464 NGN
    // Express (+50%) => 65,464 + 32,732 = 98,196 NGN
    assert(sampleJob.totalPriceNgn === 98196, `Sample full combination total calculates accurately (₦${sampleJob.totalPriceNgn.toLocaleString()})`);
    assert(
      sampleJob.escrowPlatformCommissionNgn + sampleJob.artisanNetPayoutNgn === sampleJob.totalPriceNgn,
      "Escrow Commission (20%) + Artisan Net Payout (80%) exactly reconciles with Total Payable"
    );
    assert(
      sampleJob.breakdown.length >= 6,
      `Itemized breakdown includes all 6 distinct line items: ${sampleJob.breakdown.map((b) => b.label).join(" | ")}`
    );

    // -------------------------------------------------------------
    // TEST GROUP 7: Edge Cases & Boundary Sanitization
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 7]: Edge Cases, Fallbacks & Input Boundary Sanitization");

    // 7A: Zero/negative bedroom and bathroom counts sanitize gracefully
    const edgeZero = calculateJobPrice({
      serviceId: "residential-cleaning",
      pricingModel: "PROPERTY_BASED",
      basePrice: 15000,
      bedrooms: 0,
      bathrooms: 0,
      quantity: 0,
      dirtLevel: "LIGHT",
    });
    assert(edgeZero.totalPriceNgn === 15000, "0 bedrooms and 0 bathrooms gracefully bounds to baseline (₦15,000)");

    // 7B: Missing / Invalid Plan string falls back safely to Silver
    const edgePlan = calculateJobPrice({
      serviceId: "pipe-repairs",
      pricingModel: "FIXED",
      basePrice: 15000,
      plan: "INVALID_TIER" as any,
    });
    assert(edgePlan.planTier === "SILVER" && edgePlan.totalPriceNgn === 15000, "Invalid plan tier gracefully falls back to Silver (1.0x)");

    // 7C: Unknown regional zone ID falls back safely to suburbs (0%)
    const edgeZone = calculateJobPrice({
      serviceId: "pipe-repairs",
      pricingModel: "FIXED",
      basePrice: 15000,
      regionalZoneId: "non-existent-zone",
    });
    assert(edgeZone.regionalSurchargeNgn === 0 && edgeZone.totalPriceNgn === 15000, "Unknown regional zone gracefully falls back with 0% surcharge");

  } catch (err) {
    console.error("Test execution threw an unexpected error:", err);
    failed++;
  }

  console.log("\n==================================================================");
  console.log(`PRICING ENGINE TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPricingEngineTestSuite();
