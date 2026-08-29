import { NextResponse } from "next/server";
import { partnerStore } from "@/lib/partners/store";
import { PartnerEstate } from "@/lib/partners/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("partnerId") || "ptr_sunnyvale_facility";

    const estates = await partnerStore.getEstatesByPartner(partnerId);
    return NextResponse.json({ success: true, estates });
  } catch (error: any) {
    console.error("[Estates GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch estates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      partnerId,
      name,
      city,
      state,
      address,
      totalUnits,
      occupiedUnits,
      gateSecurityPhone,
      gatePassRequired,
      preferredCategories,
    } = body;

    if (!partnerId || !name || !address) {
      return NextResponse.json(
        { error: "Partner ID, Estate Name, and Address are required." },
        { status: 400 }
      );
    }

    const partner = await partnerStore.findPartner(partnerId);
    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found." }, { status: 404 });
    }

    const newEstate: PartnerEstate = {
      id: `est_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partnerId: partner.id,
      name: name.trim(),
      city: city || "Abuja",
      state: state || "FCT",
      address: address.trim(),
      totalUnits: Number(totalUnits) || 100,
      occupiedUnits: Number(occupiedUnits) || Math.round((Number(totalUnits) || 100) * 0.8),
      gateSecurityPhone: gateSecurityPhone?.trim() || partner.phone,
      gatePassRequired: gatePassRequired !== undefined ? Boolean(gatePassRequired) : true,
      preferredCategories: Array.isArray(preferredCategories) && preferredCategories.length > 0
        ? preferredCategories
        : ["plumbing", "electrical", "cleaning", "fumigation", "hvac"],
      monthlyServiceVolume: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await partnerStore.saveEstate(newEstate);

    return NextResponse.json({
      success: true,
      message: "Estate registered successfully.",
      estate: newEstate,
    });
  } catch (error: any) {
    console.error("[Estate POST Error]:", error);
    return NextResponse.json({ error: "Failed to register estate." }, { status: 500 });
  }
}
