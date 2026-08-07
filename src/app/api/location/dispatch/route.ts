import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  rankArtisansForBooking,
  createCascadeOffer,
  ArtisanLocationProfile,
  LatLng,
} from "@/lib/location";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, serviceCategory, location, maxRadiusKm, offerIndex = 0 } = body;

    const bookingCoords: LatLng = location || { lat: 9.0765, lng: 7.4723 }; // Default Wuse 2
    const targetCategory = serviceCategory || "cleaning";

    // Query live verified artisans from DB
    let liveArtisans: ArtisanLocationProfile[] = [];
    try {
      const dbPros = await prisma.professional.findMany({
        where: { verificationStatus: "VERIFIED" },
        include: { user: true },
      });

      liveArtisans = dbPros.map((p) => {
        const u = p.user || {};
        let skills: string[] = [];
        try {
          if (p.skills) skills = JSON.parse(p.skills);
        } catch {}

        return {
          id: p.id,
          name: `${u.firstName || "Artisan"} ${u.lastName || "Pro"}`.trim(),
          phone: u.phone || "+2348000000000",
          serviceCategory: skills[0] ? skills[0].toLowerCase() : targetCategory,
          rating: p.rating || 4.9,
          totalJobs: p.totalJobs || 0,
          activeJobsCount: 0,
          isAvailable: true,
          isVerified: true,
          location: { lat: 9.0765, lng: 7.4723 },
          serviceRadiusKm: 25,
          preferredZones: ["Abuja", "Lagos"],
        };
      });
    } catch {}

    // 1. Rank Artisans using Multi-Factor Proximity + Rating + Workload Algorithm
    const rankedCandidates = rankArtisansForBooking(
      bookingCoords,
      targetCategory,
      liveArtisans,
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
