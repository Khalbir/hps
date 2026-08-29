/**
 * HandyHub Pro Solutions - Master Trade & Skillset Registry
 * Normalized category slugs, labels, and mapping utilities.
 */

export interface TradeCategoryOption {
  value: string;
  label: string;
  description: string;
}

export const MASTER_TRADE_CATEGORIES: TradeCategoryOption[] = [
  { value: "cleaning", label: "Cleaning", description: "Residential, Commercial, Deep Clean, Post-Construction" },
  { value: "fumigation", label: "Fumigation & Pest Control", description: "Eco-Safe Residential & Commercial Eradication" },
  { value: "upholstery", label: "Upholstery & Carpet Cleaning", description: "Sofa, Mattress, Rug Extraction & Detailing" },
  { value: "plumbing", label: "Plumbing", description: "Pipe Repairs, Drainage & Sewage, Water Heaters" },
  { value: "electrical", label: "Electrical", description: "Wiring & Rewiring, Sockets, Lighting Installation" },
  { value: "hvac", label: "AC & HVAC", description: "Split Unit Installation, Servicing, Gas Refill, Repairs" },
  { value: "painting", label: "Painting", description: "Interior, Exterior, Screeding & POP Surface Finish" },
  { value: "carpentry", label: "Carpentry", description: "Custom Furniture, Assembly, Cabinets & Woodwork" },
  { value: "security", label: "Security & CCTV", description: "CCTV Camera Installation & Surveillance" },
  { value: "solar", label: "Solar, Inverter & Generator", description: "Panels, Inverters, Generator Repairs" },
  { value: "home-improvement", label: "Home Improvement", description: "Interior Decoration & Home Renovation" },
  { value: "outdoor", label: "Gardening & Landscaping", description: "Lawn Care, Landscaping & Plant Maintenance" },
  { value: "laundry", label: "Laundry & Garment Care", description: "Washing, Ironing & Dry Cleaning" },
  { value: "moving", label: "Moving & Relocation", description: "Home & Office Relocation Services" },
  { value: "masonry", label: "Masonry & Tiling", description: "Tiles, Bricklaying, Plastering & Concrete" },
  { value: "appliance-repair", label: "Appliance Repair", description: "Washing Machines, Fridges, Microwave, Cooker" },
  { value: "general", label: "General Maintenance", description: "Odd Jobs, Fittings & Minor Repairs" },
  { value: "others", label: "Others", description: "Custom Skillset Request" },
];

/**
 * Normalizes any category string (slug, title, uppercase, or variant)
 * to its canonical standard slug (e.g., "Home Improvement" -> "home-improvement").
 */
export function normalizeTradeSlug(raw: string | null | undefined): string {
  if (!raw) return "cleaning";
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
  if (cleaned.includes("home-improv") || cleaned.includes("home improv") || cleaned.includes("renovat") || cleaned.includes("decorat")) return "home-improvement";
  if (cleaned.includes("garden") || cleaned.includes("lawn") || cleaned.includes("outdoor") || cleaned.includes("landscap")) return "outdoor";
  if (cleaned.includes("laund") || cleaned.includes("iron") || cleaned.includes("dry clean")) return "laundry";
  if (cleaned.includes("mov") || cleaned.includes("relocat")) return "moving";
  if (cleaned.includes("mason") || cleaned.includes("tile") || cleaned.includes("tiling") || cleaned.includes("brick")) return "masonry";
  if (cleaned.includes("appliance") || cleaned.includes("fridge") || cleaned.includes("cooker") || cleaned.includes("washing machine")) return "appliance-repair";
  if (cleaned.includes("general") || cleaned.includes("handyman") || cleaned.includes("mainten")) return "general";
  if (cleaned.includes("other")) return "others";
  if (cleaned.includes("clean") || cleaned.includes("deep clean") || cleaned.includes("janitor")) return "cleaning";

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
