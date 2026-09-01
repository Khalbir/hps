export type PricingModel = "FIXED" | "PROPERTY_BASED" | "QUANTITY_BASED" | "CUSTOM_QUOTE" | "SUBSCRIPTION";

export type ServicePlanTier = "SILVER" | "GOLD" | "PLATINUM";

export interface ServicePlanMetadata {
  id: ServicePlanTier;
  name: string;
  badge: string;
  cleaningsPerWeek: number;
  cleaningsPerMonth: number;
  multiplier: number;
  description: string;
  features: string[];
}

export const SERVICE_PLANS: Record<ServicePlanTier, ServicePlanMetadata> = {
  SILVER: {
    id: "SILVER",
    name: "Silver Plan (2 Days / Week)",
    badge: "🥈 Silver (2 Days/Wk)",
    cleaningsPerWeek: 2,
    cleaningsPerMonth: 8,
    multiplier: 1.0,
    description: "2 days per week (8 cleanings / month) · Essential home maintenance, routine dusting, vacuuming & floor sanitization.",
    features: [
      "2 Routine Cleanings Per Week (8 Visits/Month)",
      "Standard Verified Professional Housekeeper",
      "Essential Multi-Point Service Checklist",
      "Standard Workmanship Guarantee",
    ],
  },
  GOLD: {
    id: "GOLD",
    name: "Gold Plan (3 Days / Week)",
    badge: "🥇 Gold (3 Days/Wk · +25%)",
    cleaningsPerWeek: 3,
    cleaningsPerMonth: 12,
    multiplier: 1.25,
    description: "3 days per week (12 cleanings / month) · Senior specialist, deep kitchen & bathroom degrease, priority scheduling.",
    features: [
      "3 Routine Cleanings Per Week (12 Visits/Month)",
      "Senior Specialist (Top 5% Rated Housekeeper)",
      "Deep Kitchen & Bathroom Degreasing & Sanitization",
      "Extended 14-Day Warranty & Priority Support",
    ],
  },
  PLATINUM: {
    id: "PLATINUM",
    name: "Platinum Plan (6 Days / Week)",
    badge: "💎 Platinum (6 Days/Wk · +50%)",
    cleaningsPerWeek: 6,
    cleaningsPerMonth: 24,
    multiplier: 1.5,
    description: "6 days per week (24 cleanings / month) · Full-time VIP executive housekeeping, daily detailing, laundry & concierge dispatch.",
    features: [
      "6 Routine Cleanings Per Week (24 Visits/Month · Mon–Sat)",
      "Dedicated Executive Housekeeper Lead + Assistant",
      "Daily Detailed Turnover, Laundry Ironing & Microbe Shield",
      "30-Day Comprehensive Warranty & VIP Concierge Dispatch",
    ],
  },
};

/**
 * Simplified System Prompt for AI Job Estimation and Pricing Classification
 */
export const PRICING_MODEL_SYSTEM_PROMPT = `
You are the AI Pricing & Estimation Engine for HandyHub Pro.
When evaluating home service booking requests, user prompts, or service catalog items, you must classify jobs into exactly ONE of the five supported pricing models:

1. FIXED (Fixed Price Model)
   - Scope: Standardized, flat-rate repair or single-task services.
   - Example: Pipe leak repair, drain unblocking, generator servicing, AC fault diagnosis.
   - Pricing Formula: Total = (Base Fixed Price × Plan Multiplier) + Regional Surcharge + Express Surcharge.

2. PROPERTY_BASED (Property-Based Model)
   - Scope: Services where job scale and duration depend on property dimensions and surface area.
   - Key Inputs: Number of bedrooms, number of bathrooms, furnished status, condition level (Light, Moderate, Heavy), and Plan Tier (Silver, Gold, Platinum).
   - Example: Residential cleaning, deep cleaning, interior wall painting, one-time lawn care, fumigation.
   - Pricing Formula: Total = ((Base Rate + Bedroom Surcharges + Bathroom Surcharges + Furnished Surcharge) × Plan Multiplier × Condition Multiplier) + Regional/Express Surcharges.

3. QUANTITY_BASED (Quantity-Based Model)
   - Scope: Services charged per item, per unit, or per fixture.
   - Key Inputs: Quantity of units/items and Plan Tier.
   - Example: AC unit servicing/installation, CCTV camera installation, socket/switch replacement, light fixture mounting, laundry bags.
   - Pricing Formula: Total = ((Base Price per Unit × Quantity) × Plan Multiplier) + Regional/Express Surcharges.

4. CUSTOM_QUOTE (Custom Quote Model)
   - Scope: Complex, large-scale, or variable multi-trade jobs that require manual inspection.
   - Action: Dispatches a free physical on-site inspection. A detailed written quote is provided post-assessment.
   - Example: Full home renovation, electrical rewiring, exterior building painting, solar panel system installation, commercial relocation.
   - Pricing Formula: Upfront Booking Price = ₦0 (Free Physical Site Inspection).

5. SUBSCRIPTION (Monthly / Periodic Recurring Subscription Model)
   - Scope: Routine recurring estate & groundskeeping maintenance, weekly lawn care, ongoing garden & plant maintenance.
   - Example: Gardening Monthly Subscription, Routine Facility Groundskeeping.
   - Pricing Formula: Total = (Monthly Plan Base Rate × Plan Multiplier) + Regional/Schedule Surcharges.
`.trim();

export interface RegionalZone {
  id: string;
  name: string;
  state: string;
  modifierPercent: number; // e.g. 15 for +15%, 0 for baseline, 20 for +20%
}

export interface ServiceOverrideConfig {
  basePrice?: number;
  pricingModel?: PricingModel;
  unitLabel?: string;
}

export interface PricingRulesConfig {
  bedroomAddonNgn: number;
  bathroomAddonNgn: number;
  furnishedSurchargeNgn: number;
  planMultipliers: {
    SILVER: number; // e.g. 1.0 (Baseline)
    GOLD: number; // e.g. 1.25 (+25%)
    PLATINUM: number; // e.g. 1.50 (+50%)
  };
  dirtLevelMultipliers: {
    LIGHT: number; // e.g. 1.0
    MODERATE: number; // e.g. 1.15
    HEAVY: number; // e.g. 1.35 (post-construction / heavy grime)
  };
  regionalZones: RegionalZone[];
  serviceOverrides?: Record<string, ServiceOverrideConfig>;
}

export const DEFAULT_PRICING_RULES: PricingRulesConfig = {
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
  regionalZones: [
    { id: "abuja-central", name: "Abuja Central (Maitama, Asokoro, Wuse II, Guzape)", state: "FCT", modifierPercent: 15 },
    { id: "abuja-suburbs", name: "Abuja Suburbs (Gwarinpa, Lugbe, Kubwa, Dawaki, Lokogoma)", state: "FCT", modifierPercent: 0 },
    { id: "lagos-island", name: "Lagos Island (VI, Lekki, Ikoyi, Chevron)", state: "Lagos", modifierPercent: 20 },
    { id: "lagos-mainland", name: "Lagos Mainland (Ikeja, Yaba, Surulere, Gbagada)", state: "Lagos", modifierPercent: 5 },
    { id: "other-regions", name: "Other Regional Hubs (Port Harcourt, Ibadan, Kano)", state: "Other", modifierPercent: 0 },
  ],
  serviceOverrides: {},
};

/**
 * Helper to resolve effective service item values considering admin executive overrides
 */
export function getEffectiveServiceItem<T extends { id: string; price: number; pricingModel?: PricingModel; unitLabel?: string }>(
  svc: T,
  rulesConfig?: PricingRulesConfig
): T {
  if (!rulesConfig?.serviceOverrides?.[svc.id]) return svc;
  const override = rulesConfig.serviceOverrides[svc.id];
  return {
    ...svc,
    price: override.basePrice !== undefined ? override.basePrice : svc.price,
    pricingModel: override.pricingModel !== undefined ? override.pricingModel : svc.pricingModel,
    unitLabel: override.unitLabel !== undefined ? override.unitLabel : svc.unitLabel,
  };
}

export interface PriceCalculationInput {
  serviceId: string;
  pricingModel: PricingModel;
  basePrice: number;
  plan?: ServicePlanTier;
  bedrooms?: number;
  bathrooms?: number;
  isFurnished?: boolean;
  dirtLevel?: "LIGHT" | "MODERATE" | "HEAVY";
  quantity?: number;
  regionalZoneId?: string;
  isExpressSchedule?: boolean;
}

export interface PriceBreakdownItem {
  label: string;
  amountNgn: number;
}

export interface PriceCalculationResult {
  baseServicePrice: number;
  rawRoomsSubtotalNgn: number;
  planTier: ServicePlanTier;
  planMultiplier: number;
  planAdditionNgn: number;
  conditionMultiplier: number;
  conditionAdditionNgn: number;
  optionsSubtotalNgn: number;
  regionalModifierPercent: number;
  regionalSurchargeNgn: number;
  expressSurchargeNgn: number;
  totalPriceNgn: number;
  escrowPlatformCommissionNgn: number; // 20%
  artisanNetPayoutNgn: number; // 80%
  breakdown: PriceBreakdownItem[];
  isCustomQuote: boolean;
}

/**
 * Core Modular Pricing Engine for HandyHub Pro Solutions
 * 
 * Computes exact itemized pricing with the strict order of operations:
 * 1. Base Room Subtotal = Base Rate + Extra Bedroom Addons + Extra Bathroom Addons + Furnished Surcharge
 * 2. Plan Multiplier Applied = Base Room Subtotal × Plan Multiplier (Silver: 1.0x, Gold: 1.25x, Platinum: 1.50x)
 * 3. Condition Multiplier Applied = Plan Subtotal × Dirt Level Multiplier (Light: 1.0x, Moderate: 1.15x, Heavy: 1.35x)
 * 4. Regional Surcharge = Condition Subtotal × (Zone Percent / 100)
 * 5. Express Dispatch Surcharge = (Condition Subtotal + Regional Surcharge) × 0.50
 * 6. Total Payable = Condition Subtotal + Regional Surcharge + Express Surcharge
 */
export function calculateJobPrice(
  input: PriceCalculationInput,
  rulesConfig: PricingRulesConfig = DEFAULT_PRICING_RULES
): PriceCalculationResult {
  const override = rulesConfig.serviceOverrides?.[input.serviceId];
  const activePricingModel = override?.pricingModel !== undefined ? override.pricingModel : input.pricingModel;
  const activeBasePrice = override?.basePrice !== undefined ? override.basePrice : input.basePrice;

  const {
    plan = "SILVER",
    bedrooms = 2,
    bathrooms = 1,
    isFurnished = true,
    dirtLevel = "MODERATE",
    quantity = 1,
    regionalZoneId = "abuja-suburbs",
    isExpressSchedule = false,
  } = input;

  const safePlan: ServicePlanTier = (plan?.toUpperCase() === "GOLD" ? "GOLD" : plan?.toUpperCase() === "PLATINUM" ? "PLATINUM" : "SILVER");
  const planMultiplier = rulesConfig.planMultipliers?.[safePlan] ?? DEFAULT_PRICING_RULES.planMultipliers[safePlan] ?? 1.0;

  if (activePricingModel === "CUSTOM_QUOTE") {
    return {
      baseServicePrice: 0,
      rawRoomsSubtotalNgn: 0,
      planTier: safePlan,
      planMultiplier: 1.0,
      planAdditionNgn: 0,
      conditionMultiplier: 1.0,
      conditionAdditionNgn: 0,
      optionsSubtotalNgn: 0,
      regionalModifierPercent: 0,
      regionalSurchargeNgn: 0,
      expressSurchargeNgn: 0,
      totalPriceNgn: 0,
      escrowPlatformCommissionNgn: 0,
      artisanNetPayoutNgn: 0,
      breakdown: [
        { label: "On-Site Physical Inspection & Assessment", amountNgn: 0 },
        { label: "Custom Written Quote (Dispatched after Inspection)", amountNgn: 0 },
      ],
      isCustomQuote: true,
    };
  }

  const breakdown: PriceBreakdownItem[] = [];
  let rawRoomsSubtotalNgn = 0;
  let planAdditionNgn = 0;
  let conditionAdditionNgn = 0;
  let conditionMultiplier = 1.0;

  if (activePricingModel === "FIXED") {
    rawRoomsSubtotalNgn = activeBasePrice;
    breakdown.push({ label: "Base Service Rate", amountNgn: activeBasePrice });
  } else if (activePricingModel === "SUBSCRIPTION") {
    const isGardening = input.serviceId?.includes("gardening");
    if (isGardening) {
      const isTwiceMonthly = input.plan === "GOLD" || input.plan === "PLATINUM";
      const gPrice = isTwiceMonthly ? 32000 : 18000;
      rawRoomsSubtotalNgn = gPrice;
      breakdown.push({
        label: isTwiceMonthly ? "Gardening (Twice a Month Plan · 2 Visits/Mo)" : "Gardening (Once a Month Plan · 1 Visit/Mo)",
        amountNgn: gPrice,
      });
    } else {
      const isRoutineSilver = input.serviceId?.includes("silver");
      const isRoutineGold = input.serviceId?.includes("gold");
      const isRoutinePlatinum = input.serviceId?.includes("platinum");

      let baseMonthlyPrice = activeBasePrice;
      if (isRoutineSilver) {
        baseMonthlyPrice = 45000;
        breakdown.push({ label: "Silver Routine Plan (2 Days / Wk · 8 Visits/Mo)", amountNgn: 45000 });
      } else if (isRoutineGold) {
        baseMonthlyPrice = 56250;
        breakdown.push({ label: "Gold Routine Plan (3 Days / Wk · 12 Visits/Mo)", amountNgn: 56250 });
      } else if (isRoutinePlatinum) {
        baseMonthlyPrice = 67500;
        breakdown.push({ label: "Platinum VIP Routine Plan (6 Days / Wk · 24 Visits/Mo)", amountNgn: 67500 });
      } else {
        baseMonthlyPrice = activeBasePrice;
        breakdown.push({ label: "Monthly Routine Maintenance Base Plan", amountNgn: activeBasePrice });

        if (planMultiplier > 1.0) {
          planAdditionNgn = Math.round(baseMonthlyPrice * (planMultiplier - 1.0));
          const planPercent = Math.round((planMultiplier - 1.0) * 100);
          breakdown.push({
            label: `${SERVICE_PLANS[safePlan]?.name || safePlan} Plan Multiplier (+${planPercent}%)`,
            amountNgn: planAdditionNgn,
          });
        }
      }

      rawRoomsSubtotalNgn = baseMonthlyPrice;

      // Property Size Additions for Housekeeping / Routine Cleaning
      const extraBedrooms = Math.max(0, (bedrooms || 1) - 1);
      if (extraBedrooms > 0) {
        const bedroomAdditionNgn = Math.round(baseMonthlyPrice * (extraBedrooms * 0.25));
        rawRoomsSubtotalNgn += bedroomAdditionNgn;
        breakdown.push({
          label: `Additional Bedrooms (${extraBedrooms} extra bedroom${extraBedrooms > 1 ? "s" : ""})`,
          amountNgn: bedroomAdditionNgn,
        });
      }

      // Each extra bathroom adds +5% of base monthly price
      const extraBathrooms = Math.max(0, (bathrooms || 1) - 1);
      if (extraBathrooms > 0) {
        const bathroomAdditionNgn = Math.round(baseMonthlyPrice * (extraBathrooms * 0.05));
        rawRoomsSubtotalNgn += bathroomAdditionNgn;
        breakdown.push({
          label: `Additional Bathrooms (${extraBathrooms} extra bathroom${extraBathrooms > 1 ? "s" : ""})`,
          amountNgn: bathroomAdditionNgn,
        });
      }
    }
  } else if (activePricingModel === "QUANTITY_BASED") {
    const qty = Math.max(1, quantity);
    rawRoomsSubtotalNgn = activeBasePrice * qty;
    breakdown.push({
      label: `Base Unit Rate (₦${activeBasePrice.toLocaleString()} × ${qty})`,
      amountNgn: rawRoomsSubtotalNgn,
    });

    if (planMultiplier > 1.0) {
      planAdditionNgn = Math.round(rawRoomsSubtotalNgn * (planMultiplier - 1.0));
      const planPercent = Math.round((planMultiplier - 1.0) * 100);
      breakdown.push({
        label: `${SERVICE_PLANS[safePlan]?.name || safePlan} Plan Multiplier (+${planPercent}%)`,
        amountNgn: planAdditionNgn,
      });
    }
  } else if (activePricingModel === "PROPERTY_BASED") {
    // 1. Base Property Rate
    rawRoomsSubtotalNgn = activeBasePrice;
    breakdown.push({ label: "Base Property Service Rate", amountNgn: activeBasePrice });

    // 2. Additional Bedroom Add-ons (Calculated BEFORE multipliers)
    const extraBedrooms = Math.max(0, (bedrooms || 1) - 1);
    if (extraBedrooms > 0) {
      const bedroomFee = extraBedrooms * (rulesConfig.bedroomAddonNgn ?? DEFAULT_PRICING_RULES.bedroomAddonNgn);
      rawRoomsSubtotalNgn += bedroomFee;
      breakdown.push({
        label: `Additional Bedrooms (${extraBedrooms} × ₦${(rulesConfig.bedroomAddonNgn ?? DEFAULT_PRICING_RULES.bedroomAddonNgn).toLocaleString()})`,
        amountNgn: bedroomFee,
      });
    }

    // 3. Additional Bathroom Add-ons (Calculated BEFORE multipliers)
    const extraBathrooms = Math.max(0, (bathrooms || 1) - 1);
    if (extraBathrooms > 0) {
      const bathroomFee = extraBathrooms * (rulesConfig.bathroomAddonNgn ?? DEFAULT_PRICING_RULES.bathroomAddonNgn);
      rawRoomsSubtotalNgn += bathroomFee;
      breakdown.push({
        label: `Additional Bathrooms (${extraBathrooms} × ₦${(rulesConfig.bathroomAddonNgn ?? DEFAULT_PRICING_RULES.bathroomAddonNgn).toLocaleString()})`,
        amountNgn: bathroomFee,
      });
    }

    // 4. Furnished Surcharge (Calculated BEFORE multipliers)
    if (isFurnished) {
      const furnishedFee = rulesConfig.furnishedSurchargeNgn ?? DEFAULT_PRICING_RULES.furnishedSurchargeNgn;
      rawRoomsSubtotalNgn += furnishedFee;
      breakdown.push({
        label: "Furnished Property Fitting & Detail Cleaning Surcharge",
        amountNgn: furnishedFee,
      });
    }

    // 5. Plan Multiplier Applied on Aggregate Room Subtotal
    if (planMultiplier > 1.0) {
      planAdditionNgn = Math.round(rawRoomsSubtotalNgn * (planMultiplier - 1.0));
      const planPercent = Math.round((planMultiplier - 1.0) * 100);
      breakdown.push({
        label: `${SERVICE_PLANS[safePlan]?.name || safePlan} Plan Multiplier (+${planPercent}%)`,
        amountNgn: planAdditionNgn,
      });
    }

    const subtotalAfterPlan = rawRoomsSubtotalNgn + planAdditionNgn;

    // 6. Dirt / Condition / Infestation Level Multiplier Applied
    conditionMultiplier = rulesConfig.dirtLevelMultipliers?.[dirtLevel] ?? DEFAULT_PRICING_RULES.dirtLevelMultipliers[dirtLevel] ?? 1.0;
    if (conditionMultiplier > 1.0) {
      conditionAdditionNgn = Math.round(subtotalAfterPlan * (conditionMultiplier - 1.0));
      const isFumigationService = input.serviceId?.includes("fumigation") || input.serviceId?.includes("pest") || input.serviceId?.includes("bedbug") || input.serviceId?.includes("termite");
      const dirtLabel = isFumigationService
        ? dirtLevel === "HEAVY"
          ? "Severe / Heavy Infestation Level (+35%)"
          : "Moderate Infestation Level (+15%)"
        : dirtLevel === "HEAVY"
        ? "Heavy / Post-Construction Condition (+35%)"
        : "Moderate Condition (+15%)";
      breakdown.push({ label: dirtLabel, amountNgn: conditionAdditionNgn });
    }
  }

  // Combined options subtotal prior to regional/express
  const currentSubtotal = rawRoomsSubtotalNgn + planAdditionNgn + conditionAdditionNgn;

  // Regional Zone Modifier Surcharge
  const zone = rulesConfig.regionalZones?.find((z) => z.id === regionalZoneId) || rulesConfig.regionalZones?.[1] || DEFAULT_PRICING_RULES.regionalZones[1];
  const regionalModifierPercent = zone?.modifierPercent || 0;
  let regionalSurchargeNgn = 0;

  if (regionalModifierPercent > 0) {
    regionalSurchargeNgn = Math.round(currentSubtotal * (regionalModifierPercent / 100));
    breakdown.push({ label: `Regional Zone Tier (${zone.name} +${regionalModifierPercent}%)`, amountNgn: regionalSurchargeNgn });
  }

  // Express Dispatch Surcharge (+50%)
  let expressSurchargeNgn = 0;
  if (isExpressSchedule) {
    expressSurchargeNgn = Math.round((currentSubtotal + regionalSurchargeNgn) * 0.5);
    breakdown.push({ label: "Express Urgent Dispatch (Under 60 Mins)", amountNgn: expressSurchargeNgn });
  }

  const totalPriceNgn = Math.round(currentSubtotal + regionalSurchargeNgn + expressSurchargeNgn);
  const escrowPlatformCommissionNgn = Math.round(totalPriceNgn * 0.20); // 20% Escrow Platform Commission
  const artisanNetPayoutNgn = totalPriceNgn - escrowPlatformCommissionNgn; // 80% Artisan Net Payout

  return {
    baseServicePrice: activeBasePrice,
    rawRoomsSubtotalNgn,
    planTier: safePlan,
    planMultiplier,
    planAdditionNgn,
    conditionMultiplier,
    conditionAdditionNgn,
    optionsSubtotalNgn: currentSubtotal,
    regionalModifierPercent,
    regionalSurchargeNgn,
    expressSurchargeNgn,
    totalPriceNgn,
    escrowPlatformCommissionNgn,
    artisanNetPayoutNgn,
    breakdown,
    isCustomQuote: false,
  };
}
