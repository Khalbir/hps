import { PricingModel } from "./pricingEngine";

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  desc: string;
  keywords?: string[];
  pricingModel?: PricingModel;
  unitLabel?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  services: ServiceItem[];
}

export interface PopularSuggestion {
  text: string;
  categoryId: string;
  serviceId?: string;
  label: string;
}

export const POPULAR_SUGGESTIONS: PopularSuggestion[] = [
  {
    text: "My kitchen sink is leaking",
    label: "My kitchen sink is leaking",
    categoryId: "plumbing",
    serviceId: "pipe-repairs",
  },
  {
    text: "I need a deep cleaning",
    label: "I need a deep cleaning",
    categoryId: "cleaning",
    serviceId: "deep-cleaning",
  },
  {
    text: "AC not cooling properly",
    label: "AC not cooling properly",
    categoryId: "hvac",
    serviceId: "ac-repair",
  },
  {
    text: "Fumigation & pest control for house",
    label: "Fumigation & Pest Control",
    categoryId: "fumigation",
    serviceId: "residential-fumigation",
  },
  {
    text: "Sofa & mattress deep steam cleaning",
    label: "Upholstery & Carpet Cleaning",
    categoryId: "upholstery",
    serviceId: "sofa-couch-cleaning",
  },
  {
    text: "Install CCTV cameras",
    label: "Install CCTV cameras",
    categoryId: "security",
    serviceId: "cctv-installation",
  },
  {
    text: "Paint my living room",
    label: "Paint my living room",
    categoryId: "painting",
    serviceId: "interior-painting",
  },
  {
    text: "Fix electrical socket or wiring",
    label: "Fix electrical socket",
    categoryId: "electrical",
    serviceId: "socket-switch",
  },
  {
    text: "Solar panel & inverter setup",
    label: "Solar panel setup",
    categoryId: "solar",
    serviceId: "solar-installation",
  },
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "cleaning",
    name: "Cleaning",
    color: "#00A8B5",
    keywords: ["clean", "cleaning", "maid", "housekeeper", "dust", "deep clean", "office clean", "janitor", "wash", "sweeping", "mopping"],
    services: [
      { id: "residential-cleaning", name: "Residential Cleaning (One-Time)", price: 15000, desc: "Standard deep cleaning for apartments and houses", pricingModel: "PROPERTY_BASED" },
      { id: "residential-cleaning-monthly", name: "Residential Cleaning (Monthly Subscription)", price: 45000, desc: "Routine recurring housekeeping: Silver (2 days/wk), Gold (3 days/wk), Platinum (6 days/wk)", pricingModel: "SUBSCRIPTION", unitLabel: "per month" },
      { id: "deep-cleaning", name: "Deep Cleaning", price: 25000, desc: "Thorough deep cleaning of every surface", pricingModel: "PROPERTY_BASED" },
      { id: "commercial-cleaning", name: "Commercial Cleaning", price: 35000, desc: "Office and business space cleaning", pricingModel: "QUANTITY_BASED", unitLabel: "per office space" },
      { id: "post-construction", name: "Post Construction Cleaning", price: 0, desc: "Cleanup after renovation (Free site inspection & quote)", pricingModel: "CUSTOM_QUOTE" },
    ],
  },
  {
    id: "fumigation",
    name: "Fumigation & Pest Control",
    color: "#10B981",
    keywords: ["fumigation", "fumigate", "pest", "pest control", "insects", "cockroaches", "mosquitoes", "termites", "bedbugs", "bed bug", "rats", "rodents", "bugs", "spraying", "disinfection"],
    services: [
      { id: "residential-fumigation", name: "Residential Fumigation", price: 25000, desc: "Complete home & compound pest eradication", pricingModel: "PROPERTY_BASED" },
      { id: "commercial-fumigation", name: "Commercial Fumigation", price: 0, desc: "Offices, warehouses, plazas, schools & commercial facilities (Free physical site inspection & assessment)", pricingModel: "CUSTOM_QUOTE" },
      { id: "bedbug-eradication", name: "Bedbug Eradication", price: 30000, desc: "Targeted deep heat & residual bedbug elimination", pricingModel: "PROPERTY_BASED" },
      { id: "termite-control", name: "Anti-Termite Treatment", price: 0, desc: "Comprehensive foundation & woodwork anti-termite barrier (Free site inspection & quote)", pricingModel: "CUSTOM_QUOTE" },
    ],
  },
  {
    id: "upholstery",
    name: "Upholstery & Carpet Cleaning",
    color: "#8B5CF6",
    keywords: ["upholstery", "sofa", "couch", "mattress", "carpet", "rug", "chairs", "cushion", "fabric", "stain removal", "car interior", "car seat", "steamer", "extraction"],
    services: [
      { id: "sofa-couch-cleaning", name: "Sofa & Couch Extraction", price: 15000, desc: "Deep steam shampoo & stain removal for sofas", pricingModel: "QUANTITY_BASED", unitLabel: "per sofa/set" },
      { id: "mattress-sanitization", name: "Mattress Sanitization", price: 12000, desc: "Deep dust-mite extraction & anti-allergen steam sanitize", pricingModel: "QUANTITY_BASED", unitLabel: "per mattress" },
      { id: "rug-carpet-cleaning", name: "Rug & Carpet Shampooing", price: 10000, desc: "Wall-to-wall carpets & luxury area rugs", pricingModel: "QUANTITY_BASED", unitLabel: "per rug/carpet" },
      { id: "car-interior-detailing", name: "Car Interior Detailing", price: 20000, desc: "Complete vehicle seats, floor & roof lining extraction", pricingModel: "QUANTITY_BASED", unitLabel: "per vehicle" },
    ],
  },
  {
    id: "plumbing",
    name: "Plumbing",
    color: "#3B82F6",
    keywords: ["plumb", "plumbing", "sink", "leak", "leaking", "pipe", "water", "drain", "drainage", "clog", "clogged", "sewage", "heater", "faucet", "tap", "toilet", "burst"],
    services: [
      { id: "pipe-repairs", name: "Pipe Repairs", price: 15000, desc: "Fix leaking and burst pipes", pricingModel: "FIXED" },
      { id: "drainage-sewage", name: "Drainage & Sewage", price: 15000, desc: "Drain unblocking and sewage maintenance", pricingModel: "FIXED" },
      { id: "water-heater", name: "Water Heater Installation", price: 20000, desc: "Install or repair water heating unit", pricingModel: "QUANTITY_BASED", unitLabel: "per unit" },
    ],
  },
  {
    id: "electrical",
    name: "Electrical",
    color: "#F59E0B",
    keywords: ["electric", "electrical", "wire", "wiring", "socket", "switch", "breaker", "light", "lighting", "chandelier", "power", "short circuit", "spark", "panel"],
    services: [
      { id: "wiring-rewiring", name: "Wiring & Rewiring", price: 0, desc: "Full or partial electrical wiring assessment", pricingModel: "CUSTOM_QUOTE" },
      { id: "socket-switch", name: "Socket & Switch Repair", price: 5000, desc: "Replace or install sockets", pricingModel: "QUANTITY_BASED", unitLabel: "per socket/switch" },
      { id: "lighting", name: "Lighting Installation", price: 8000, desc: "Chandeliers, spotlights & fixtures", pricingModel: "QUANTITY_BASED", unitLabel: "per light fixture" },
    ],
  },
  {
    id: "hvac",
    name: "AC & HVAC",
    color: "#06B6D4",
    keywords: ["ac", "air conditioner", "air conditioning", "hvac", "cool", "cooling", "refill", "gas refill", "split unit", "heat", "fan"],
    services: [
      { id: "ac-installation", name: "AC Installation", price: 15000, desc: "Split unit AC installation", pricingModel: "QUANTITY_BASED", unitLabel: "per AC unit" },
      { id: "ac-servicing", name: "AC Servicing", price: 8000, desc: "AC cleaning and gas refill", pricingModel: "QUANTITY_BASED", unitLabel: "per AC unit" },
      { id: "ac-repair", name: "AC Repair", price: 12000, desc: "Diagnose and fix AC faults", pricingModel: "FIXED" },
    ],
  },
  {
    id: "painting",
    name: "Painting",
    color: "#EC4899",
    keywords: ["paint", "painting", "painter", "wall", "interior paint", "exterior paint", "color", "coat", "primer"],
    services: [
      { id: "interior-painting", name: "Interior Painting", price: 20000, desc: "Full interior room painting", pricingModel: "PROPERTY_BASED" },
      { id: "exterior-painting", name: "Exterior Painting", price: 0, desc: "Building exterior painting & scaffolding", pricingModel: "CUSTOM_QUOTE" },
    ],
  },
  {
    id: "carpentry",
    name: "Carpentry",
    color: "#A16207",
    keywords: ["carpenter", "carpentry", "furniture", "wood", "cabinet", "shelf", "door", "table", "bed", "woodwork"],
    services: [
      { id: "furniture-assembly", name: "Furniture Assembly", price: 8000, desc: "Assemble flat-pack furniture", pricingModel: "QUANTITY_BASED", unitLabel: "per furniture piece" },
      { id: "custom-carpentry", name: "Custom Carpentry", price: 0, desc: "Custom shelves, cabinets & woodwork", pricingModel: "CUSTOM_QUOTE" },
    ],
  },
  {
    id: "security",
    name: "Security",
    color: "#6366F1",
    keywords: ["security", "cctv", "camera", "surveillance", "alarm", "monitor"],
    services: [
      { id: "cctv-installation", name: "CCTV Installation", price: 25000, desc: "Camera setup & configuration", pricingModel: "QUANTITY_BASED", unitLabel: "per camera channel" },
    ],
  },
  {
    id: "solar",
    name: "Solar & Power",
    color: "#F97316",
    keywords: ["solar", "inverter", "panel", "battery", "generator", "power supply", "renewable"],
    services: [
      { id: "solar-installation", name: "Solar Panel Installation", price: 0, desc: "Solar panel and inverter system sizing", pricingModel: "CUSTOM_QUOTE" },
      { id: "inverter-installation", name: "Inverter Installation", price: 30000, desc: "Inverter and battery setup", pricingModel: "FIXED" },
      { id: "generator-repairs", name: "Generator Repairs", price: 8000, desc: "Generator servicing & spark plug check", pricingModel: "FIXED" },
    ],
  },
  {
    id: "home-improvement",
    name: "Home Improvement",
    color: "#059669",
    keywords: ["renovation", "remodel", "remodeling", "interior decoration", "home improvement", "design", "decor"],
    services: [
      { id: "interior-decoration", name: "Interior Decoration", price: 0, desc: "Space planning & design", pricingModel: "CUSTOM_QUOTE" },
      { id: "home-renovation", name: "Home Renovation", price: 0, desc: "Complete home or office remodeling", pricingModel: "CUSTOM_QUOTE" },
    ],
  },
  {
    id: "outdoor",
    name: "Gardening & Landscaping",
    color: "#16A34A",
    keywords: ["garden", "gardening", "lawn", "grass", "landscaping", "plants", "trees", "outdoor", "compound", "groundskeeping"],
    services: [
      {
        id: "gardening",
        name: "Gardening (One-Time Flat Rate)",
        price: 15000,
        desc: "One-time lawn mowing, weed clearance, hedge trimming & compound cleaning",
        pricingModel: "FIXED",
      },
      {
        id: "gardening-monthly",
        name: "Gardening (Monthly Subscription)",
        price: 35000,
        desc: "Routine weekly garden maintenance, lawn care, tree pruning, soil nourishment & groundskeeping",
        pricingModel: "SUBSCRIPTION",
        unitLabel: "per month",
      },
      {
        id: "landscaping-tree-felling",
        name: "Landscaping & Tree Trimming",
        price: 0,
        desc: "Landscape architecture, flowerbed design & major tree pruning (Free site inspection & quote)",
        pricingModel: "CUSTOM_QUOTE",
      },
    ],
  },
  {
    id: "laundry",
    name: "Laundry",
    color: "#0891B2",
    keywords: ["laundry", "wash", "washing", "ironing", "dry clean", "dry cleaning", "clothes"],
    services: [
      { id: "laundry-services", name: "Laundry Services", price: 5000, desc: "Washing, ironing & dry cleaning", pricingModel: "QUANTITY_BASED", unitLabel: "per laundry bag" },
    ],
  },
  {
    id: "moving",
    name: "Moving",
    color: "#CA8A04",
    keywords: ["moving", "relocate", "relocation", "mover", "haul", "truck", "packing"],
    services: [
      { id: "moving-services", name: "Moving Services", price: 0, desc: "Home & office relocation", pricingModel: "CUSTOM_QUOTE" },
    ],
  },
  {
    id: "general",
    name: "Handyman",
    color: "#64748B",
    keywords: ["handyman", "odd jobs", "repairs", "fixing", "maintenance", "fix"],
    services: [
      { id: "general-handyman", name: "General Handyman", price: 15000, desc: "Odd jobs & minor repairs", pricingModel: "FIXED" },
    ],
  },
];

/**
 * Helper to build the direct booking URL for a popular query or service
 */
export function getBookingUrl(categoryId: string, serviceId?: string, textQuery?: string): string {
  const params = new URLSearchParams();
  if (categoryId) params.set("category", categoryId);
  if (serviceId) params.set("service", serviceId);
  if (textQuery) params.set("query", textQuery);
  return `/book?${params.toString()}`;
}

/**
 * Resolves a category ID and optional service ID from query params or text input.
 */
export function resolveServiceCategory(input: {
  categoryParam?: string | null;
  serviceParam?: string | null;
  queryParam?: string | null;
}): { categoryId: string | null; serviceId: string | null; matchedService?: ServiceItem } {
  const { categoryParam, serviceParam, queryParam } = input;

  // 1. Direct Category Match
  if (categoryParam) {
    const cat = SERVICE_CATEGORIES.find(
      (c) => c.id.toLowerCase() === categoryParam.toLowerCase() || c.name.toLowerCase() === categoryParam.toLowerCase()
    );
    if (cat) {
      let matchedService: ServiceItem | undefined;
      if (serviceParam) {
        matchedService = cat.services.find(
          (s) => s.id.toLowerCase() === serviceParam.toLowerCase() || s.name.toLowerCase().replace(/\s+/g, "-") === serviceParam.toLowerCase()
        );
      }
      if (matchedService || !serviceParam) {
        return { categoryId: cat.id, serviceId: matchedService?.id || null, matchedService };
      }
    }
  }

  // 2. Direct Service Match via serviceParam (slug or id)
  if (serviceParam) {
    const cleanService = serviceParam.toLowerCase().trim();
    for (const cat of SERVICE_CATEGORIES) {
      if (cat.id.toLowerCase() === cleanService) {
        return { categoryId: cat.id, serviceId: null };
      }
      const svc = cat.services.find(
        (s) => s.id.toLowerCase() === cleanService || s.name.toLowerCase().replace(/\s+/g, "-") === cleanService
      );
      if (svc) {
        return { categoryId: cat.id, serviceId: svc.id, matchedService: svc };
      }
    }
  }

  // 3. Natural Language Query Match via queryParam
  if (queryParam && queryParam.trim().length > 0) {
    const q = queryParam.toLowerCase().trim();

    // Check popular suggestions first for exact or partial phrase match
    const suggestionMatch = POPULAR_SUGGESTIONS.find(
      (s) => q.includes(s.text.toLowerCase()) || s.text.toLowerCase().includes(q)
    );
    if (suggestionMatch) {
      const cat = SERVICE_CATEGORIES.find((c) => c.id === suggestionMatch.categoryId);
      const svc = cat?.services.find((s) => s.id === suggestionMatch.serviceId);
      return { categoryId: suggestionMatch.categoryId, serviceId: suggestionMatch.serviceId || null, matchedService: svc };
    }

    // Score category matches by keywords
    let bestCategory: string | null = null;
    let maxScore = 0;

    for (const cat of SERVICE_CATEGORIES) {
      let score = 0;

      // Check category name
      if (q.includes(cat.name.toLowerCase())) score += 10;

      // Check category keywords
      for (const kw of cat.keywords) {
        if (q.includes(kw.toLowerCase())) {
          score += 5;
        }
      }

      // Check services inside category
      for (const svc of cat.services) {
        if (q.includes(svc.name.toLowerCase())) {
          score += 8;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestCategory = cat.id;
      }
    }

    if (bestCategory && maxScore > 0) {
      return { categoryId: bestCategory, serviceId: null };
    }
  }

  return { categoryId: null, serviceId: null };
}
