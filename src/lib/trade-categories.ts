/**
 * HandyHub Pro Solutions - Master Trade & Skillset Registry
 * Normalized category slugs, labels, and mapping utilities.
 */

export interface TradeCategoryOption {
  value: string;
  label: string;
  description: string;
  keywords?: string[];
}

export const MASTER_TRADE_CATEGORIES: TradeCategoryOption[] = [
  { value: "cleaning", label: "Cleaning", description: "Residential, Commercial, Deep Clean, Post-Construction", keywords: ["cleaning", "clean", "residential", "commercial", "deep clean", "post-construction", "janitor", "maid"] },
  { value: "fumigation", label: "Fumigation & Pest Control", description: "Eco-Safe Residential & Commercial Eradication", keywords: ["fumigation", "pest", "pest control", "cockroach", "bedbug", "termite", "rodent", "insect", "disinfection"] },
  { value: "upholstery", label: "Upholstery & Carpet Cleaning", description: "Sofa, Mattress, Rug Extraction & Detailing", keywords: ["upholstery", "carpet", "rug", "sofa", "mattress", "couch", "fabric", "steam clean"] },
  { value: "plumbing", label: "Plumbing", description: "Pipe Repairs, Drainage & Sewage, Water Heaters", keywords: ["plumbing", "plumber", "pipe", "drain", "drainage", "sewage", "sink", "toilet", "tap", "faucet", "water heater", "borehole", "pumping machine"] },
  { value: "electrical", label: "Electrical", description: "Wiring & Rewiring, Sockets, Lighting Installation", keywords: ["electrical", "electrician", "wiring", "socket", "breaker", "lighting", "chandelier", "conduit", "fuse", "short circuit"] },
  { value: "hvac", label: "AC & HVAC", description: "Split Unit Installation, Servicing, Gas Refill, Repairs", keywords: ["hvac", "ac", "air condition", "air conditioner", "split unit", "gas refill", "cooling", "compressor", "refrigeration"] },
  { value: "painting", label: "Painting", description: "Interior, Exterior, Screeding & POP Surface Finish", keywords: ["painting", "painter", "paint", "screeding", "pop", "wall", "interior paint", "exterior paint", "wallpaper"] },
  { value: "carpentry", label: "Carpentry", description: "Custom Furniture, Assembly, Cabinets & Woodwork", keywords: ["carpentry", "carpenter", "furniture", "woodwork", "cabinet", "wardrobe", "cupboard", "bed frame", "door lock", "wood"] },
  { value: "security", label: "Security & CCTV", description: "CCTV Camera Installation & Surveillance", keywords: ["security", "cctv", "camera", "surveillance", "intercom", "alarm", "access control", "electric fence"] },
  { value: "solar", label: "Solar, Inverter & Generator", description: "Panels, Inverters, Generator Repairs", keywords: ["solar", "inverter", "generator", "battery", "solar panel", "charge controller", "power backup"] },
  { value: "home-improvement", label: "Home Improvement", description: "Interior Decoration & Home Renovation", keywords: ["home improvement", "home-improvement", "interior decoration", "renovation", "remodel", "fitout", "decor", "interior design", "false ceiling"] },
  { value: "outdoor", label: "Gardening & Landscaping", description: "Lawn Care, Landscaping & Plant Maintenance", keywords: ["gardening", "gardener", "landscaping", "lawn", "grass mowing", "flower", "outdoor", "irrigation"] },
  { value: "laundry", label: "Laundry & Garment Care", description: "Washing, Ironing & Dry Cleaning", keywords: ["laundry", "dry cleaning", "ironing", "washing", "garment", "clothes"] },
  { value: "moving", label: "Moving & Relocation", description: "Home & Office Relocation Services", keywords: ["moving", "relocation", "packers", "logistics", "hauling", "loading"] },
  { value: "masonry", label: "Masonry & Tiling", description: "Tiles, Bricklaying, Plastering & Concrete", keywords: ["masonry", "tiling", "tiles", "tiler", "bricklaying", "plastering", "concrete", "interlocking"] },
  { value: "appliance-repair", label: "Appliance Repair", description: "Washing Machines, Fridges, Microwave, Cooker", keywords: ["appliance", "fridge", "freezer", "refrigerator", "washing machine", "microwave", "gas cooker", "oven", "blender", "iron"] },
  { value: "general", label: "General Maintenance", description: "Odd Jobs, Fittings & Minor Repairs", keywords: ["general", "handyman", "maintenance", "odd jobs", "fixture", "curtain rod", "tv mounting"] },
  { value: "others", label: "Others", description: "Custom Skillset Request", keywords: ["other", "custom", "specialized"] },
];

/**
 * Normalizes any category string (slug, title, uppercase, or variant)
 * to its canonical standard slug (e.g., "Home Improvement" -> "home-improvement").
 */
export function normalizeTradeSlug(raw: string | null | undefined): string {
  if (!raw) return "general";
  const cleaned = raw.toLowerCase().trim().replace(/_/g, "-");

  if (cleaned.includes("pest") || cleaned.includes("fumigat")) return "fumigation";
  if (cleaned.includes("upholster") || cleaned.includes("carpet") || cleaned.includes("rug")) return "upholstery";
  if (cleaned.includes("plumb") || cleaned.includes("pipe") || cleaned.includes("drain")) return "plumbing";
  if (cleaned.includes("electr") || cleaned.includes("wire") || cleaned.includes("wiring")) return "electrical";
  if (cleaned.includes("ac") || cleaned.includes("hvac") || cleaned.includes("air condition") || cleaned.includes("refrigerat")) return "hvac";
  if (cleaned.includes("paint") || cleaned.includes("pop") || cleaned.includes("screed")) return "painting";
  if (cleaned.includes("carpent") || cleaned.includes("wood") || cleaned.includes("furnitur")) return "carpentry";
  if (cleaned.includes("cctv") || cleaned.includes("secur")) return "security";
  if (cleaned.includes("solar") || cleaned.includes("inverter") || cleaned.includes("generator")) return "solar";
  if (cleaned.includes("home-improv") || cleaned.includes("home improv") || cleaned.includes("renovat") || cleaned.includes("decorat") || cleaned.includes("interior")) return "home-improvement";
  if (cleaned.includes("garden") || cleaned.includes("lawn") || cleaned.includes("outdoor") || cleaned.includes("landscap")) return "outdoor";
  if (cleaned.includes("laund") || cleaned.includes("iron") || cleaned.includes("dry clean")) return "laundry";
  if (cleaned.includes("mov") || cleaned.includes("relocat")) return "moving";
  if (cleaned.includes("mason") || cleaned.includes("tile") || cleaned.includes("tiling") || cleaned.includes("brick")) return "masonry";
  if (cleaned.includes("appliance") || cleaned.includes("fridge") || cleaned.includes("cooker") || cleaned.includes("washing machine")) return "appliance-repair";
  if (cleaned.includes("handyman") || cleaned.includes("mainten")) return "general";
  if (cleaned.includes("clean") || cleaned.includes("deep clean") || cleaned.includes("janitor") || cleaned.includes("maid")) return "cleaning";

  // Check direct slug match
  const exact = MASTER_TRADE_CATEGORIES.find((c) => c.value === cleaned);
  if (exact) return exact.value;

  return cleaned || "general";
}

/**
 * Returns the human-friendly display label for a category slug or string.
 */
export function getTradeCategoryLabel(raw: string | null | undefined): string {
  if (!raw) return "General Skilled Services";
  const slug = normalizeTradeSlug(raw);
  const match = MASTER_TRADE_CATEGORIES.find((c) => c.value === slug);
  if (match) return match.label;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Extract all matching trade slugs from any arbitrary text (e.g. "One-Time Deep Cleaning", "Interior Decoration", "AC Servicing")
 */
export function extractTradeSlugsFromText(text: string | null | undefined): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matchedSlugs = new Set<string>();

  for (const cat of MASTER_TRADE_CATEGORIES) {
    if (lower.includes(cat.value)) {
      matchedSlugs.add(cat.value);
    }
    if (cat.keywords) {
      for (const kw of cat.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          matchedSlugs.add(cat.value);
          break;
        }
      }
    }
  }

  // Also include the normalized full text
  matchedSlugs.add(normalizeTradeSlug(text));

  return Array.from(matchedSlugs).filter(Boolean);
}

/**
 * Extracts all verified trade categories and declared skillsets for a professional.
 */
export function getArtisanTradeSlugs(pro: any): string[] {
  if (!pro) return [];
  const slugs = new Set<string>();

  // 1. Primary trade / serviceCategory if present
  if (pro.serviceCategory) {
    slugs.add(normalizeTradeSlug(pro.serviceCategory));
  }
  if (pro.primaryTrade) {
    slugs.add(normalizeTradeSlug(pro.primaryTrade));
  }

  // 2. Trade Verifications (only VERIFIED or APPROVED)
  if (Array.isArray(pro.tradeVerifications)) {
    for (const tv of pro.tradeVerifications) {
      if (tv.status === "VERIFIED" || tv.status === "APPROVED") {
        if (tv.tradeCategory) slugs.add(normalizeTradeSlug(tv.tradeCategory));
        if (tv.tradeName) slugs.add(normalizeTradeSlug(tv.tradeName));
      }
    }
  }

  // 3. Declared Skills JSON array
  if (pro.skills) {
    let skillList: any[] = [];
    if (typeof pro.skills === "string") {
      try {
        skillList = JSON.parse(pro.skills);
      } catch {
        skillList = pro.skills.split(/[,;|]+/);
      }
    } else if (Array.isArray(pro.skills)) {
      skillList = pro.skills;
    }

    for (const skill of skillList) {
      if (typeof skill === "string") {
        const found = extractTradeSlugsFromText(skill);
        found.forEach((s) => slugs.add(s));
      }
    }
  }

  // 4. Associated services
  if (Array.isArray(pro.services)) {
    for (const s of pro.services) {
      const sName = s.service?.name || s.name || "";
      const sCat = s.service?.category?.slug || s.service?.category?.name || s.category || "";
      extractTradeSlugsFromText(sName).forEach((sl) => slugs.add(sl));
      extractTradeSlugsFromText(sCat).forEach((sl) => slugs.add(sl));
    }
  }

  return Array.from(slugs).filter(Boolean);
}

/**
 * Extracts required trade categories / slugs from a booking, service, or job request.
 */
export function getJobRequiredTradeSlugs(jobOrService: {
  serviceCategory?: string | null;
  serviceName?: string | null;
  service?: { name?: string; slug?: string; category?: { slug?: string; name?: string } } | null;
  tradeCategories?: string[] | null;
  title?: string | null;
  reference?: string | null;
  message?: string | null;
}): string[] {
  const slugs = new Set<string>();

  if (jobOrService.tradeCategories && Array.isArray(jobOrService.tradeCategories)) {
    jobOrService.tradeCategories.forEach((t) => slugs.add(normalizeTradeSlug(t)));
  }

  if (jobOrService.serviceCategory) {
    extractTradeSlugsFromText(jobOrService.serviceCategory).forEach((s) => slugs.add(s));
  }

  if (jobOrService.serviceName) {
    extractTradeSlugsFromText(jobOrService.serviceName).forEach((s) => slugs.add(s));
  }

  if (jobOrService.service) {
    if (jobOrService.service.name) extractTradeSlugsFromText(jobOrService.service.name).forEach((s) => slugs.add(s));
    if (jobOrService.service.slug) extractTradeSlugsFromText(jobOrService.service.slug).forEach((s) => slugs.add(s));
    if (jobOrService.service.category?.slug) extractTradeSlugsFromText(jobOrService.service.category.slug).forEach((s) => slugs.add(s));
    if (jobOrService.service.category?.name) extractTradeSlugsFromText(jobOrService.service.category.name).forEach((s) => slugs.add(s));
  }

  if (jobOrService.title) {
    extractTradeSlugsFromText(jobOrService.title).forEach((s) => slugs.add(s));
  }

  if (jobOrService.message) {
    extractTradeSlugsFromText(jobOrService.message).forEach((s) => slugs.add(s));
  }

  return Array.from(slugs).filter(Boolean);
}

/**
 * Strict Trade & Skillset Gate: Returns true IF AND ONLY IF the artisan possesses
 * verified trade credentials or matching skillsets for the specified job/service.
 */
export function isArtisanQualifiedForJob(
  pro: any,
  jobOrService: {
    serviceCategory?: string | null;
    serviceName?: string | null;
    service?: { name?: string; slug?: string; category?: { slug?: string; name?: string } } | null;
    tradeCategories?: string[] | null;
    title?: string | null;
    reference?: string | null;
    message?: string | null;
  }
): boolean {
  if (!pro) return false;

  const proTrades = getArtisanTradeSlugs(pro);
  if (proTrades.length === 0) {
    // If the pro has no verified trades or declared skillsets registered, they cannot be qualified for specialized jobs
    return false;
  }

  const requiredTrades = getJobRequiredTradeSlugs(jobOrService);
  if (requiredTrades.length === 0) {
    // If no specific trade can be inferred, do not broadcast randomly
    return false;
  }

  // Check for direct intersection
  const hasMatch = requiredTrades.some((rt) => proTrades.includes(rt));
  return hasMatch;
}

