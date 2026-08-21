export type PricingModel = "FIXED" | "PROPERTY_BASED" | "QUANTITY_BASED" | "CUSTOM_QUOTE" | "SUBSCRIPTION";

/**
 * Simplified System Prompt for AI Job Estimation and Pricing Classification
 */
export const PRICING_MODEL_SYSTEM_PROMPT = `
You are the AI Pricing & Estimation Engine for HandyHub Pro.
When evaluating home service booking requests, user prompts, or service catalog items, you must classify jobs into exactly ONE of the five supported pricing models:

1. FIXED (Fixed Price Model)
   - Scope: Standardized, flat-rate repair or single-task services.
   - Example: Pipe leak repair, drain unblocking, generator servicing, AC fault diagnosis.
   - Pricing Formula: Total = Base Fixed Price + Regional Surcharge + Express Surcharge.

2. PROPERTY_BASED (Property-Based Model)
   - Scope: Services where job scale and duration depend on property dimensions and surface area.
   - Key Inputs: Number of bedrooms, number of bathrooms, furnished status, condition level (Light, Moderate, Heavy).
   - Example: Residential cleaning, deep cleaning, interior wall painting, one-time lawn care.
   - Pricing Formula: Total = (Base Rate + Bedroom Surcharges + Bathroom Surcharges + Furnished Surcharge) × Condition Multiplier + Regional/Express Surcharges.

3. QUANTITY_BASED (Quantity-Based Model)
   - Scope: Services charged per item, per unit, or per fixture.
   - Key Inputs: Quantity of units/items.
   - Example: AC unit servicing/installation, CCTV camera installation, socket/switch replacement, light fixture mounting, laundry bags.
   - Pricing Formula: Total = (Base Price per Unit × Quantity) + Regional/Express Surcharges.

4. CUSTOM_QUOTE (Custom Quote Model)
   - Scope: Complex, large-scale, or variable multi-trade jobs that require manual inspection.
   - Action: Dispatches a free physical on-site inspection. A detailed written quote is provided post-assessment.
   - Example: Full home renovation, electrical rewiring, exterior building painting, solar panel system installation, commercial relocation.
   - Pricing Formula: Upfront Booking Price = ₦0 (Free Physical Site Inspection).

5. SUBSCRIPTION (Monthly / Periodic Recurring Subscription Model)
   - Scope: Routine recurring estate & groundskeeping maintenance, weekly lawn care, ongoing garden & plant maintenance.
   - Example: Gardening Monthly Subscription, Routine Facility Groundskeeping.
   - Pricing Formula: Total = Monthly Plan Base Rate + Regional/Schedule Surcharges.
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

export function calculateJobPrice(
  input: PriceCalculationInput,
  rulesConfig: PricingRulesConfig = DEFAULT_PRICING_RULES
): PriceCalculationResult {
  const override = rulesConfig.serviceOverrides?.[input.serviceId];
  const activePricingModel = override?.pricingModel !== undefined ? override.pricingModel : input.pricingModel;
  const activeBasePrice = override?.basePrice !== undefined ? override.basePrice : input.basePrice;

  const {
    bedrooms = 2,
    bathrooms = 1,
    isFurnished = false,
    dirtLevel = "MODERATE",
    quantity = 1,
    regionalZoneId = "abuja-suburbs",
    isExpressSchedule = false,
  } = input;

  if (activePricingModel === "CUSTOM_QUOTE") {
    return {
      baseServicePrice: 0,
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
  let currentSubtotal = 0;

  if (activePricingModel === "FIXED") {
    currentSubtotal = activeBasePrice;
    breakdown.push({ label: "Base Service Rate", amountNgn: activeBasePrice });
  } else if (activePricingModel === "SUBSCRIPTION") {
    currentSubtotal = activeBasePrice;
    breakdown.push({ label: "Monthly Routine Maintenance Plan", amountNgn: activeBasePrice });
  } else if (activePricingModel === "QUANTITY_BASED") {
    const qty = Math.max(1, quantity);
    currentSubtotal = activeBasePrice * qty;
    breakdown.push({ label: `Base Unit Rate (₦${activeBasePrice.toLocaleString()} × ${qty})`, amountNgn: currentSubtotal });
  } else if (activePricingModel === "PROPERTY_BASED") {
    // Deep Cleaning / Property-based logic
    currentSubtotal = activeBasePrice;
    breakdown.push({ label: "Base Property Service Rate", amountNgn: activeBasePrice });

    // Bedroom Add-on
    const extraBedrooms = Math.max(0, bedrooms - 1);
    if (extraBedrooms > 0) {
      const bedroomFee = extraBedrooms * rulesConfig.bedroomAddonNgn;
      currentSubtotal += bedroomFee;
      breakdown.push({ label: `Additional Bedrooms (${extraBedrooms} × ₦${rulesConfig.bedroomAddonNgn.toLocaleString()})`, amountNgn: bedroomFee });
    }

    // Bathroom Add-on
    const extraBathrooms = Math.max(0, bathrooms - 1);
    if (extraBathrooms > 0) {
      const bathroomFee = extraBathrooms * rulesConfig.bathroomAddonNgn;
      currentSubtotal += bathroomFee;
      breakdown.push({ label: `Additional Bathrooms (${extraBathrooms} × ₦${rulesConfig.bathroomAddonNgn.toLocaleString()})`, amountNgn: bathroomFee });
    }

    // Furnished Surcharge
    if (isFurnished) {
      currentSubtotal += rulesConfig.furnishedSurchargeNgn;
      breakdown.push({ label: "Furnished Property Fitting & Detail Cleaning Surcharge", amountNgn: rulesConfig.furnishedSurchargeNgn });
    }

    // Dirt / Condition Level Multiplier
    const multiplier = rulesConfig.dirtLevelMultipliers[dirtLevel] || 1.0;
    if (multiplier > 1.0) {
      const dirtAddition = Math.round(currentSubtotal * (multiplier - 1.0));
      currentSubtotal += dirtAddition;
      const dirtLabel = dirtLevel === "HEAVY" ? "Heavy / Post-Construction Condition (+35%)" : "Moderate Condition (+15%)";
      breakdown.push({ label: dirtLabel, amountNgn: dirtAddition });
    }
  }

  // Regional Zone Modifier Surcharge
  const zone = rulesConfig.regionalZones.find((z) => z.id === regionalZoneId) || rulesConfig.regionalZones[1]; // fallback suburbs
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
  const escrowPlatformCommissionNgn = Math.round(totalPriceNgn * 0.20); // 20%
  const artisanNetPayoutNgn = totalPriceNgn - escrowPlatformCommissionNgn; // 80%

  return {
    baseServicePrice: activeBasePrice,
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
