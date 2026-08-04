import { NextResponse } from "next/server";
import { geocodeAddressCached } from "@/lib/location";

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address string is required" }, { status: 400 });
    }

    const coords = geocodeAddressCached(address);
    return NextResponse.json({
      address,
      location: coords,
      cached: true,
      provider: "HandyHub Location Intelligence Cache",
    });
  } catch (error) {
    console.error("[Geocode API Error]:", error);
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 }
    );
  }
}
