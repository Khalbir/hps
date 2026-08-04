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

// Popular Abuja Locations Pre-cached for Instant Zero-Cost Lookup
const ABUJA_PRECACHED_LOCATIONS: Record<string, LatLng> = {
  "maitama, abuja": { lat: 9.0882, lng: 7.4984 },
  "wuse 2, abuja": { lat: 9.0765, lng: 7.4723 },
  "jabi, abuja": { lat: 9.0701, lng: 7.4258 },
  "garki, abuja": { lat: 9.0345, lng: 7.4891 },
  "asokoro, abuja": { lat: 9.0498, lng: 7.5256 },
  "utako, abuja": { lat: 9.0667, lng: 7.4500 },
  "gwarinpa, abuja": { lat: 9.1123, lng: 7.3981 },
  "apo, abuja": { lat: 8.9876, lng: 7.5123 },
  "kubwa, abuja": { lat: 9.1543, lng: 7.3321 },
  "lugbe, abuja": { lat: 8.9743, lng: 7.3789 },
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
 * Address Autocomplete with Caching
 */
export async function getCachedAutocompleteSuggestions(query: string): Promise<AutocompleteSuggestion[]> {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];

  // 1. Check cache first
  if (autocompleteCache.has(cleanQuery)) {
    return autocompleteCache.get(cleanQuery)!;
  }

  // 2. Filter pre-cached Abuja locations
  const matches: AutocompleteSuggestion[] = [];
  Object.entries(ABUJA_PRECACHED_LOCATIONS).forEach(([key, coords]) => {
    if (key.includes(cleanQuery) || cleanQuery.includes(key.split(",")[0])) {
      const parts = key.split(",");
      matches.push({
        placeId: `cached_${key.replace(/\s+/g, "_")}`,
        description: key.toUpperCase(),
        mainText: parts[0].toUpperCase(),
        secondaryText: parts[1]?.toUpperCase() || "ABUJA, NIGERIA",
        location: coords,
      });
    }
  });

  // 3. Fallback generic suggestions if no exact pre-cache match
  if (matches.length === 0) {
    const defaultCoords: LatLng = { lat: 9.0765, lng: 7.4723 }; // Central Wuse 2
    matches.push({
      placeId: `gen_${cleanQuery.replace(/\s+/g, "_")}`,
      description: `${query.toUpperCase()}, ABUJA, NIGERIA`,
      mainText: query.toUpperCase(),
      secondaryText: "ABUJA, FCT, NIGERIA",
      location: defaultCoords,
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
  for (const [key, coords] of Object.entries(ABUJA_PRECACHED_LOCATIONS)) {
    if (cleanAddress.includes(key.split(",")[0])) {
      return coords;
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
  const candidates = allArtisans.filter((artisan) => {
    if (!artisan.isAvailable || !artisan.isVerified) return false;
    if (artisan.serviceCategory.toLowerCase() !== serviceCategory.toLowerCase()) return false;

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
