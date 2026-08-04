import { NextResponse } from "next/server";
import {
  rankArtisansForBooking,
  createCascadeOffer,
  ArtisanLocationProfile,
  LatLng,
} from "@/lib/location";

// Mock Online Verified Artisans with GPS Locations across Abuja
const MOCK_ONLINE_ARTISANS: ArtisanLocationProfile[] = [
  {
    id: "art_blessing",
    name: "Blessing O.",
    phone: "+234 801 000 1122",
    serviceCategory: "cleaning",
    rating: 4.8,
    totalJobs: 312,
    activeJobsCount: 0,
    isAvailable: true,
    isVerified: true,
    location: { lat: 9.0765, lng: 7.4723 }, // Wuse 2
    serviceRadiusKm: 15,
    preferredZones: ["Wuse 2", "Maitama", "Utako"],
  },
  {
    id: "art_grace",
    name: "Grace E.",
    phone: "+234 802 111 2233",
    serviceCategory: "cleaning",
    rating: 4.9,
    totalJobs: 184,
    activeJobsCount: 1,
    isAvailable: true,
    isVerified: true,
    location: { lat: 9.0882, lng: 7.4984 }, // Maitama
    serviceRadiusKm: 20,
    preferredZones: ["Maitama", "Asokoro"],
  },
  {
    id: "art_ibrahim",
    name: "Ibrahim M.",
    phone: "+234 803 222 3344",
    serviceCategory: "plumbing",
    rating: 4.9,
    totalJobs: 189,
    activeJobsCount: 0,
    isAvailable: true,
    isVerified: true,
    location: { lat: 9.0701, lng: 7.4258 }, // Jabi
    serviceRadiusKm: 15,
    preferredZones: ["Jabi", "Utako"],
  },
  {
    id: "art_abubakar",
    name: "Abubakar T.",
    phone: "+234 804 333 4455",
    serviceCategory: "electrical",
    rating: 4.9,
    totalJobs: 247,
    activeJobsCount: 0,
    isAvailable: true,
    isVerified: true,
    location: { lat: 9.0345, lng: 7.4891 }, // Garki
    serviceRadiusKm: 25,
    preferredZones: ["Garki", "Apo"],
  },
  {
    id: "art_yusuf",
    name: "Yusuf A.",
    phone: "+234 805 444 5566",
    serviceCategory: "hvac",
    rating: 4.7,
    totalJobs: 156,
    activeJobsCount: 0,
    isAvailable: true,
    isVerified: true,
    location: { lat: 9.1123, lng: 7.3981 }, // Gwarinpa
    serviceRadiusKm: 20,
    preferredZones: ["Gwarinpa", "Life Camp"],
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, serviceCategory, location, maxRadiusKm, offerIndex = 0 } = body;

    const bookingCoords: LatLng = location || { lat: 9.0765, lng: 7.4723 }; // Default Wuse 2
    const targetCategory = serviceCategory || "cleaning";

    // 1. Rank Artisans using Multi-Factor Proximity + Rating + Workload Algorithm
    const rankedCandidates = rankArtisansForBooking(
      bookingCoords,
      targetCategory,
      MOCK_ONLINE_ARTISANS,
      maxRadiusKm || 25
    );

    if (rankedCandidates.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No verified online artisans currently available within your service area.",
        rankedCandidates: [],
      });
    }

    // 2. Select Candidate based on offerIndex (for cascading if previous pro declined/expired)
    const selectedCandidate = rankedCandidates[offerIndex % rankedCandidates.length];

    // 3. Create 2-Minute Auto-Offer Payload
    const offer = createCascadeOffer(bookingId || "demo_booking_101", selectedCandidate, offerIndex);

    return NextResponse.json({
      success: true,
      bookingId: bookingId || "demo_booking_101",
      offer,
      selectedArtisan: selectedCandidate.artisan,
      rankingMetrics: {
        distanceKm: selectedCandidate.distanceKm,
        proximityScore: selectedCandidate.proximityScore,
        ratingScore: selectedCandidate.ratingScore,
        workloadPenalty: selectedCandidate.workloadPenalty,
        finalScore: selectedCandidate.finalScore,
      },
      allRankedCandidates: rankedCandidates.map((c) => ({
        id: c.artisan.id,
        name: c.artisan.name,
        distanceKm: c.distanceKm,
        finalScore: c.finalScore,
      })),
    });
  } catch (error) {
    console.error("[Dispatch Engine Error]:", error);
    return NextResponse.json(
      { error: "Internal server error in matching dispatch engine" },
      { status: 500 }
    );
  }
}
