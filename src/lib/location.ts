/**
 * Location Intelligence Module for HandyHub Pro Solutions
 * Handles Geocoding, Caching, Proximity Math, Multi-Factor Artisan Ranking,
 * and Cascade Dispatch logic.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ArtisanLocationProfile {
  id: string;
  name: string;
  phone: string;
  serviceCategory: string;
  serviceCategories?: string[];
  rating: number;
  totalJobs: number;
  activeJobsCount: number;
  isAvailable: boolean;
  isVerified: boolean;
  location: LatLng;
  serviceRadiusKm: number;
  preferredZones: string[];
}

export interface AutocompleteSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  location: LatLng;
}

export interface DispatchOffer {
  id: string;
  bookingId: string;
  artisanId: string;
  artisanName: string;
  score: number;
  distanceKm: number;
  status: "OFFERED" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  expiresAt: string; // ISO string (2-minute window)
  offerIndex: number;
}

// In-Memory Geocoding & Distance Cache (Reduces API Calls)
const geocodeCache = new Map<string, LatLng>();
const autocompleteCache = new Map<string, AutocompleteSuggestion[]>();

import { stateStore } from "@/lib/states/store";

// Popular Nigerian Locations Pre-cached for Instant Zero-Cost Lookup across Operating Hubs
const NIGERIA_PRECACHED_LOCATIONS: Record<string, { lat: number; lng: number; state: string }> = {
  // FCT Abuja
  "maitama, abuja": { lat: 9.0882, lng: 7.4984, state: "FCT" },
  "wuse 2, abuja": { lat: 9.0765, lng: 7.4723, state: "FCT" },
  "jabi, abuja": { lat: 9.0701, lng: 7.4258, state: "FCT" },
  "garki, abuja": { lat: 9.0345, lng: 7.4891, state: "FCT" },
  "asokoro, abuja": { lat: 9.0498, lng: 7.5256, state: "FCT" },
  "utako, abuja": { lat: 9.0667, lng: 7.4500, state: "FCT" },
  "gwarinpa, abuja": { lat: 9.1123, lng: 7.3981, state: "FCT" },
  "apo, abuja": { lat: 8.9876, lng: 7.5123, state: "FCT" },
  "kubwa, abuja": { lat: 9.1543, lng: 7.3321, state: "FCT" },
  "lugbe, abuja": { lat: 8.9743, lng: 7.3789, state: "FCT" },

  // Lagos
  "lekki phase 1, lagos": { lat: 6.4474, lng: 3.4723, state: "LAGOS" },
  "victoria island, lagos": { lat: 6.4281, lng: 3.4219, state: "LAGOS" },
  "ikoyi, lagos": { lat: 6.4549, lng: 3.4346, state: "LAGOS" },
  "ikeja gra, lagos": { lat: 6.5960, lng: 3.3551, state: "LAGOS" },
  "magodo phase 2, lagos": { lat: 6.6214, lng: 3.3855, state: "LAGOS" },
  "surulere, lagos": { lat: 6.5000, lng: 3.3500, state: "LAGOS" },

  // Rivers
  "gra phase 2, port harcourt": { lat: 4.8156, lng: 7.0123, state: "RIVERS" },
  "obio-akpor, port harcourt": { lat: 4.8450, lng: 6.9980, state: "RIVERS" },
  "peter odili, port harcourt": { lat: 4.7980, lng: 7.0340, state: "RIVERS" },

  // Oyo
  "bodija, ibadan": { lat: 7.4350, lng: 3.9120, state: "OYO" },
  "agodi gra, ibadan": { lat: 7.4120, lng: 3.9050, state: "OYO" },
  "dugbe, ibadan": { lat: 7.3850, lng: 3.8820, state: "OYO" },

  // Kano
  "nassarawa gra, kano": { lat: 12.0022, lng: 8.5450, state: "KANO" },
  "kano municipal, kano": { lat: 11.9964, lng: 8.5167, state: "KANO" },
};

/**
 * Calculates distance between two coordinates using Haversine formula (in KM)
 */
export function calculateHaversineDistanceKm(pointA: LatLng, pointB: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((pointB.lat - pointA.lat) * Math.PI) / 180;
  const dLng = ((pointB.lng - pointA.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pointA.lat * Math.PI) / 180) *
      Math.cos((pointB.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

/**
 * Address Autocomplete with Caching & Dynamic Active State Filtering
 */
export async function getCachedAutocompleteSuggestions(query: string): Promise<AutocompleteSuggestion[]> {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];

  // 1. Check cache first
  if (autocompleteCache.has(cleanQuery)) {
    return autocompleteCache.get(cleanQuery)!;
  }

  // 2. Fetch Active States from State Store
  const activeStates = await stateStore.getActiveStates();
  const activeStateCodes = new Set(activeStates.map((s) => s.code.toUpperCase()));

  // 3. Filter pre-cached locations belonging ONLY to currently active operating states
  const matches: AutocompleteSuggestion[] = [];
  Object.entries(NIGERIA_PRECACHED_LOCATIONS).forEach(([key, loc]) => {
    if (activeStateCodes.has(loc.state.toUpperCase())) {
      if (key.includes(cleanQuery) || cleanQuery.includes(key.split(",")[0])) {
        const parts = key.split(",");
        matches.push({
          placeId: `cached_${key.replace(/\s+/g, "_")}`,
          description: key.toUpperCase(),
          mainText: parts[0].toUpperCase(),
          secondaryText: parts[1]?.toUpperCase() || `${loc.state}, NIGERIA`,
          location: { lat: loc.lat, lng: loc.lng },
        });
      }
    }
  });

  // 4. Fallback generic suggestions if no exact pre-cache match
  if (matches.length === 0) {
    const primaryActiveState = activeStates[0] || { name: "FCT Abuja", code: "FCT", coordinates: { lat: 9.0765, lng: 7.4723 } };
    matches.push({
      placeId: `gen_${cleanQuery.replace(/\s+/g, "_")}`,
      description: `${query.toUpperCase()}, ${primaryActiveState.name.toUpperCase()}, NIGERIA`,
      mainText: query.toUpperCase(),
      secondaryText: `${primaryActiveState.name.toUpperCase()}, NIGERIA`,
      location: primaryActiveState.coordinates,
    });
  }

  // Store in cache
  autocompleteCache.set(cleanQuery, matches);
  return matches;
}

/**
 * Forward Geocoding with Caching
 */
export function geocodeAddressCached(address: string): LatLng {
  const cleanAddress = address.toLowerCase().trim();
  for (const [key, loc] of Object.entries(NIGERIA_PRECACHED_LOCATIONS)) {
    if (cleanAddress.includes(key.split(",")[0])) {
      return { lat: loc.lat, lng: loc.lng };
    }
  }
  if (geocodeCache.has(cleanAddress)) {
    return geocodeCache.get(cleanAddress)!;
  }
  // Default to Abuja Central
  const defaultLoc: LatLng = { lat: 9.0765, lng: 7.4723 };
  geocodeCache.set(cleanAddress, defaultLoc);
  return defaultLoc;
}

export interface RankedArtisanScore {
  artisan: ArtisanLocationProfile;
  distanceKm: number;
  proximityScore: number; // 0-100
  ratingScore: number; // 0-100
  workloadPenalty: number; // 0-100
  finalScore: number; // 0-100
}

/**
 * Artisan Ranking Engine
 * Formula: FinalScore = (ProximityScore * 0.45) + (RatingScore * 0.35) - (WorkloadPenalty * 0.20)
 */
export function rankArtisansForBooking(
  bookingLocation: LatLng,
  serviceCategory: string,
  allArtisans: ArtisanLocationProfile[],
  maxRadiusKm: number = 25
): RankedArtisanScore[] {
  const targetCat = serviceCategory.toLowerCase().trim();
  const candidates = allArtisans.filter((artisan) => {
    if (!artisan.isAvailable || !artisan.isVerified) return false;
    
    // Check multi-skills and trade categories
    const cats: string[] = [];
    if (Array.isArray(artisan.serviceCategories)) {
      cats.push(...artisan.serviceCategories.map((c) => c.toLowerCase().trim()));
    }
    if (artisan.serviceCategory) {
      cats.push(...artisan.serviceCategory.toLowerCase().split(/[,;|\s]+/).map((c) => c.trim()));
    }

    const matchesCategory = cats.length === 0 || cats.some((c) => c.includes(targetCat) || targetCat.includes(c) || c === "general");
    if (!matchesCategory) return false;

    const distance = calculateHaversineDistanceKm(bookingLocation, artisan.location);
    return distance <= Math.min(artisan.serviceRadiusKm, maxRadiusKm);
  });

  const scored = candidates.map((artisan) => {
    const distanceKm = calculateHaversineDistanceKm(bookingLocation, artisan.location);

    // Proximity score: 100 at 0km down to 0 at maxRadiusKm
    const proximityScore = Math.max(0, 100 - (distanceKm / maxRadiusKm) * 100);

    // Rating score: (rating / 5.0) * 100
    const ratingScore = (artisan.rating / 5.0) * 100;

    // Workload penalty: 25 points per active job
    const workloadPenalty = Math.min(100, artisan.activeJobsCount * 25);

    // Weighted final calculation
    const finalScore = Math.round(
      proximityScore * 0.45 + ratingScore * 0.35 - workloadPenalty * 0.20
    );

    return {
      artisan,
      distanceKm,
      proximityScore: Math.round(proximityScore),
      ratingScore: Math.round(ratingScore),
      workloadPenalty: Math.round(workloadPenalty),
      finalScore: Math.max(0, finalScore),
    };
  });

  // Sort descending by finalScore
  return scored.sort((a, b) => b.finalScore - a.finalScore);
}

/**
 * Creates a 2-minute auto-offer payload for the top-ranked candidate
 */
export function createCascadeOffer(
  bookingId: string,
  rankedCandidate: RankedArtisanScore,
  offerIndex: number = 0
): DispatchOffer {
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes window
  return {
    id: `offer_${bookingId}_${offerIndex}_${Date.now()}`,
    bookingId,
    artisanId: rankedCandidate.artisan.id,
    artisanName: rankedCandidate.artisan.name,
    score: rankedCandidate.finalScore,
    distanceKm: rankedCandidate.distanceKm,
    status: "OFFERED",
    expiresAt,
    offerIndex,
  };
}
