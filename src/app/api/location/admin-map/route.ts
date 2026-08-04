import { NextResponse } from "next/server";

export async function GET() {
  try {
    const activeBookings = [
      {
        id: "HHP-M1K9X",
        service: "Deep Cleaning",
        customer: "Amina Ibrahim",
        pro: "Blessing O.",
        status: "IN_PROGRESS",
        location: { lat: 9.0882, lng: 7.4984 },
        address: "12 Aminu Kano, Maitama, Abuja",
        price: "₦25,000",
      },
      {
        id: "HHP-N2L0Y",
        service: "Electrical Repairs",
        customer: "Chidi Okonkwo",
        pro: "Abubakar T.",
        status: "CONFIRMED",
        location: { lat: 9.0765, lng: 7.4723 },
        address: "Plot 5, Wuse 2, Abuja",
        price: "₦15,000",
      },
      {
        id: "HHP-O3M1Z",
        service: "Plumbing Repair",
        customer: "Grace Nwosu",
        pro: "Ibrahim M.",
        status: "DISPATCHED",
        location: { lat: 9.0701, lng: 7.4258 },
        address: "7 Alex Ekwueme Way, Jabi, Abuja",
        price: "₦10,000",
      },
    ];

    const onlineArtisans = [
      {
        id: "art_blessing",
        name: "Blessing O.",
        trade: "Cleaning Specialist",
        rating: 4.8,
        status: "ONLINE",
        location: { lat: 9.0765, lng: 7.4723 },
        serviceRadiusKm: 15,
        battery: "88%",
      },
      {
        id: "art_grace",
        name: "Grace E.",
        trade: "Deep Cleaning Pro",
        rating: 4.9,
        status: "ON_JOB",
        location: { lat: 9.0882, lng: 7.4984 },
        serviceRadiusKm: 20,
        battery: "94%",
      },
      {
        id: "art_ibrahim",
        name: "Ibrahim M.",
        trade: "Master Plumber",
        rating: 4.9,
        status: "ONLINE",
        location: { lat: 9.0701, lng: 7.4258 },
        serviceRadiusKm: 15,
        battery: "76%",
      },
      {
        id: "art_abubakar",
        name: "Abubakar T.",
        trade: "Senior Electrician",
        rating: 4.9,
        status: "ONLINE",
        location: { lat: 9.0345, lng: 7.4891 },
        serviceRadiusKm: 25,
        battery: "91%",
      },
    ];

    return NextResponse.json({
      activeBookings,
      onlineArtisans,
      cacheStats: {
        totalGeocodes: 1420,
        cacheHits: 1250,
        cacheHitRate: "88.0%",
        estimatedApiSavingsUsd: "$71.00",
      },
    });
  } catch (error) {
    console.error("[Admin Map API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin map telemetry data" },
      { status: 500 }
    );
  }
}
