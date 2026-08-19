import { prisma } from "./prisma";
import { calculateHaversineDistanceKm } from "./location";

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return calculateHaversineDistanceKm({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
}

export interface DefaultZoneConfig {
  name: string;
  slug: string;
  centerLatitude: number;
  centerLongitude: number;
  coverageRadiusKm: number;
  baseLogisticsFee: number;
  estimatedDeliveryHours: number;
}

export interface DefaultRegionConfig {
  name: string;
  code: string;
  country: string;
  isMarketplaceActive: boolean;
  description: string;
  order: number;
  zones: DefaultZoneConfig[];
}

export const DEFAULT_MARKETPLACE_REGIONS: DefaultRegionConfig[] = [
  {
    name: "Federal Capital Territory (Abuja)",
    code: "FCT",
    country: "Nigeria",
    isMarketplaceActive: true, // Phase 1 active region
    description: "Primary operational region with full GPS delivery coverage and verified merchant hub.",
    order: 1,
    zones: [
      {
        name: "Maitama / Wuse 2 / Central Business District",
        slug: "abuja-central-maitama-wuse",
        centerLatitude: 9.0882,
        centerLongitude: 7.4984,
        coverageRadiusKm: 7.5,
        baseLogisticsFee: 1500,
        estimatedDeliveryHours: 1.5,
      },
      {
        name: "Garki / Asokoro / Guzape Hills",
        slug: "abuja-garki-asokoro-guzape",
        centerLatitude: 9.035,
        centerLongitude: 7.502,
        coverageRadiusKm: 8.0,
        baseLogisticsFee: 1500,
        estimatedDeliveryHours: 1.5,
      },
      {
        name: "Jabi / Utako / Jahi / Mabushi",
        slug: "abuja-jabi-utako-jahi",
        centerLatitude: 9.076,
        centerLongitude: 7.432,
        coverageRadiusKm: 7.5,
        baseLogisticsFee: 1500,
        estimatedDeliveryHours: 1.5,
      },
      {
        name: "Gwarinpa / Life Camp / Kado / Dawaki",
        slug: "abuja-gwarinpa-lifecamp-dawaki",
        centerLatitude: 9.108,
        centerLongitude: 7.391,
        coverageRadiusKm: 9.0,
        baseLogisticsFee: 2000,
        estimatedDeliveryHours: 2.0,
      },
      {
        name: "Apo / Durumi / Lokogoma / Kabusa",
        slug: "abuja-apo-durumi-lokogoma",
        centerLatitude: 9.002,
        centerLongitude: 7.472,
        coverageRadiusKm: 8.5,
        baseLogisticsFee: 2000,
        estimatedDeliveryHours: 2.0,
      },
      {
        name: "Kubwa / Dutse / Bwari District",
        slug: "abuja-kubwa-dutse-bwari",
        centerLatitude: 9.145,
        centerLongitude: 7.34,
        coverageRadiusKm: 12.0,
        baseLogisticsFee: 2500,
        estimatedDeliveryHours: 2.5,
      },
      {
        name: "Lugbe / Airport Road / Pyakasa / Kuje",
        slug: "abuja-lugbe-airportroad-kuje",
        centerLatitude: 8.974,
        centerLongitude: 7.378,
        coverageRadiusKm: 14.0,
        baseLogisticsFee: 2500,
        estimatedDeliveryHours: 2.5,
      },
    ],
  },
  {
    name: "Lagos State",
    code: "LA",
    country: "Nigeria",
    isMarketplaceActive: false, // Inactive for Phase 1 - 1-click enable in Admin
    description: "Future commercial state expansion (Ikeja, Island, Lekki, Mainland).",
    order: 2,
    zones: [
      {
        name: "Lagos Island / Victoria Island / Lekki Phase 1",
        slug: "lagos-island-vi-lekki",
        centerLatitude: 6.4281,
        centerLongitude: 3.4219,
        coverageRadiusKm: 12.0,
        baseLogisticsFee: 2500,
        estimatedDeliveryHours: 3.0,
      },
      {
        name: "Ikeja / Maryland / Magodo / GRA",
        slug: "lagos-ikeja-maryland-magodo",
        centerLatitude: 6.6018,
        centerLongitude: 3.3515,
        coverageRadiusKm: 10.0,
        baseLogisticsFee: 2500,
        estimatedDeliveryHours: 2.5,
      },
    ],
  },
  {
    name: "Rivers State (Port Harcourt)",
    code: "RI",
    country: "Nigeria",
    isMarketplaceActive: false,
    description: "Future South-South hub (Old GRA, Trans-Amadi, Peter Odili).",
    order: 3,
    zones: [
      {
        name: "Port Harcourt Central / Old GRA / Trans-Amadi",
        slug: "ph-central-gra-transamadi",
        centerLatitude: 4.8156,
        centerLongitude: 7.0498,
        coverageRadiusKm: 10.0,
        baseLogisticsFee: 2000,
        estimatedDeliveryHours: 2.0,
      },
    ],
  },
  {
    name: "Kano State",
    code: "KN",
    country: "Nigeria",
    isMarketplaceActive: false,
    description: "Future Northern commercial trade center (Nassarawa, Fagge, Bompai).",
    order: 4,
    zones: [],
  },
  {
    name: "Oyo State (Ibadan)",
    code: "OY",
    country: "Nigeria",
    isMarketplaceActive: false,
    description: "Future South-West expansion (Bodija, Oluyole, Ring Road).",
    order: 5,
    zones: [],
  },
  {
    name: "Kaduna State",
    code: "KD",
    country: "Nigeria",
    isMarketplaceActive: false,
    description: "Future North-West industrial center (Barnawa, Malali, Kaduna Central).",
    order: 6,
    zones: [],
  },
  {
    name: "Delta State",
    code: "DE",
    country: "Nigeria",
    isMarketplaceActive: false,
    description: "Future South-South trade center (Warri, Asaba).",
    order: 7,
    zones: [],
  },
];

let isSeededCache = false;

/**
 * Initializes and synchronizes default regions and service zones in database.
 */
export async function ensureDefaultMarketplaceRegionsAndZones() {
  if (isSeededCache) return;

  const count = await prisma.marketplaceRegion.count();
  if (count >= DEFAULT_MARKETPLACE_REGIONS.length) {
    isSeededCache = true;
    return;
  }

  for (const reg of DEFAULT_MARKETPLACE_REGIONS) {
    const existingRegion = await prisma.marketplaceRegion.findUnique({
      where: { code: reg.code },
    });

    let regionId = existingRegion?.id;

    if (!existingRegion) {
      const created = await prisma.marketplaceRegion.create({
        data: {
          name: reg.name,
          code: reg.code,
          country: reg.country,
          isMarketplaceActive: reg.isMarketplaceActive,
          description: reg.description,
          order: reg.order,
        },
      });
      regionId = created.id;
    }

    if (regionId && reg.zones.length > 0) {
      for (const zone of reg.zones) {
        const existingZone = await prisma.marketplaceServiceZone.findUnique({
          where: { slug: zone.slug },
        });

        if (!existingZone) {
          await prisma.marketplaceServiceZone.create({
            data: {
              regionId,
              name: zone.name,
              slug: zone.slug,
              centerLatitude: zone.centerLatitude,
              centerLongitude: zone.centerLongitude,
              coverageRadiusKm: zone.coverageRadiusKm,
              baseLogisticsFee: zone.baseLogisticsFee,
              estimatedDeliveryHours: zone.estimatedDeliveryHours,
              isActive: true,
            },
          });
        }
      }
    }
  }
}

/**
 * Fetches all regions and active service zones for public or customer consumption.
 */
export async function getActiveMarketplaceRegions() {
  await ensureDefaultMarketplaceRegionsAndZones();
  return prisma.marketplaceRegion.findMany({
    where: { isMarketplaceActive: true },
    include: {
      serviceZones: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
}

/**
 * Validates whether a delivery state/city is within an active marketplace region.
 * Returns the region and the best matched service zone based on coordinates or address.
 */
export async function validateDeliveryRegionAndZone(params: {
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  serviceZoneId?: string;
}) {
  const activeRegions = await getActiveMarketplaceRegions();

  if (activeRegions.length === 0) {
    return {
      isValid: false,
      reason: "No active marketplace regions found in system.",
    };
  }

  // If serviceZoneId provided, check direct match
  if (params.serviceZoneId) {
    for (const reg of activeRegions) {
      const matchedZone = reg.serviceZones.find((z) => z.id === params.serviceZoneId);
      if (matchedZone) {
        return {
          isValid: true,
          region: reg,
          zone: matchedZone,
        };
      }
    }
  }

  // Check by state name / code
  const inputState = (params.state || params.city || "").toLowerCase().trim();
  const matchedRegion = activeRegions.find(
    (r) =>
      r.code.toLowerCase() === inputState ||
      r.name.toLowerCase().includes(inputState) ||
      inputState.includes("fct") ||
      inputState.includes("abuja")
  );

  if (!matchedRegion) {
    return {
      isValid: false,
      isOutsideActiveRegion: true,
      reason:
        "HandyHub Marketplace parts fulfillment is currently operating exclusively in Abuja (FCT). Your selected delivery location is outside the active regional fulfillment network.",
    };
  }

  // If GPS coordinates are provided, find nearest zone in matched region
  let bestZone = matchedRegion.serviceZones[0] || null;
  if (params.latitude && params.longitude && matchedRegion.serviceZones.length > 0) {
    let minDistance = Infinity;
    for (const zone of matchedRegion.serviceZones) {
      const dist = calculateDistanceKm(
        params.latitude,
        params.longitude,
        zone.centerLatitude,
        zone.centerLongitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        bestZone = zone;
      }
    }
  }

  return {
    isValid: true,
    region: matchedRegion,
    zone: bestZone,
  };
}

/**
 * Computes estimated logistics fee based on zone baseline.
 */
export function calculateZoneLogisticsFee(zone?: { baseLogisticsFee: number } | null, weightKg: number = 1): number {
  const base = zone?.baseLogisticsFee || 1500;
  const excessWeight = Math.max(0, weightKg - 2);
  return base + excessWeight * 300;
}
