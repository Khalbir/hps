import { NextResponse } from "next/server";
import { partnerStore } from "@/lib/partners/store";
import { EstateResident } from "@/lib/partners/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("partnerId");
    if (!partnerId) {
      return NextResponse.json({ success: true, residents: [] });
    }
    const residents = await partnerStore.getResidentsByPartner(partnerId);
    return NextResponse.json({ success: true, residents });
  } catch (error: any) {
    console.error("[Residents GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch residents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partnerId, estateId, residentName, unitNumber, phone, email } = body;

    if (!partnerId || !estateId || !residentName || !unitNumber || !phone) {
      return NextResponse.json(
        { error: "Partner ID, Estate ID, Resident Name, Unit Number, and Phone Number are required." },
        { status: 400 }
      );
    }

    const partner = await partnerStore.findPartner(partnerId);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found." }, { status: 404 });
    }

    const newResident: EstateResident = {
      id: `res_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      estateId,
      partnerId: partner.id,
      residentName: residentName.trim(),
      unitNumber: unitNumber.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      status: "ACTIVE",
      totalBookings: 0,
      totalSpendNgn: 0,
      lastBookingDate: null,
      joinedAt: new Date().toISOString().split("T")[0],
    };

    await partnerStore.saveResident(newResident);

    // Credit partner with activation bonus (₦1,000)
    const config = await partnerStore.getConfig();
    const bonus = config.rates.estateManagerResidentBonusNgn || 1000;
    const updatedPartner = {
      ...partner,
      walletBalance: partner.walletBalance + bonus,
      totalEarnings: partner.totalEarnings + bonus,
      updatedAt: new Date().toISOString(),
    };
    await partnerStore.savePartner(updatedPartner);

    return NextResponse.json({
      success: true,
      message: `Resident enrolled successfully! ₦${bonus.toLocaleString()} onboarding bonus added to your commission wallet.`,
      resident: newResident,
      newBalance: updatedPartner.walletBalance,
    });
  } catch (error: any) {
    console.error("[Residents POST Error]:", error);
    return NextResponse.json({ error: "Failed to enroll resident." }, { status: 500 });
  }
}
