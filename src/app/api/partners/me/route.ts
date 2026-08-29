import { NextResponse } from "next/server";
import { partnerStore } from "@/lib/partners/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("partnerId") || searchParams.get("code") || searchParams.get("email") || "ptr_sunnyvale_facility";

    const partner = await partnerStore.findPartner(identifier);
    if (!partner) {
      // Return default top estate manager if not found
      const fallback = await partnerStore.findPartner("ptr_sunnyvale_facility");
      const estates = await partnerStore.getEstatesByPartner(fallback!.id);
      const residents = await partnerStore.getResidentsByPartner(fallback!.id);
      const requests = await partnerStore.getServiceRequestsByPartner(fallback!.id);
      const attributions = await partnerStore.getAttributionsByPartner(fallback!.id);
      const payouts = await partnerStore.getPayouts(fallback!.id);

      return NextResponse.json({
        success: true,
        partner: fallback,
        estates,
        residents,
        requests,
        attributions,
        payouts,
      });
    }

    const estates = await partnerStore.getEstatesByPartner(partner.id);
    const residents = await partnerStore.getResidentsByPartner(partner.id);
    const requests = await partnerStore.getServiceRequestsByPartner(partner.id);
    const attributions = await partnerStore.getAttributionsByPartner(partner.id);
    const payouts = await partnerStore.getPayouts(partner.id);

    return NextResponse.json({
      success: true,
      partner,
      estates,
      residents,
      requests,
      attributions,
      payouts,
    });
  } catch (error: any) {
    console.error("[Partner Me API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch partner profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partnerId, bankName, bankAccount, accountName, phone, address, operatingState } = body;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    const partner = await partnerStore.findPartner(partnerId);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const updated = {
      ...partner,
      bankName: bankName !== undefined ? bankName : partner.bankName,
      bankAccount: bankAccount !== undefined ? bankAccount : partner.bankAccount,
      accountName: accountName !== undefined ? accountName : partner.accountName,
      phone: phone !== undefined ? phone : partner.phone,
      address: address !== undefined ? address : partner.address,
      operatingState: operatingState !== undefined ? operatingState : partner.operatingState,
      updatedAt: new Date().toISOString(),
    };

    await partnerStore.savePartner(updated);

    return NextResponse.json({
      success: true,
      message: "Partner profile updated successfully",
      partner: updated,
    });
  } catch (error: any) {
    console.error("[Partner Profile Update Error]:", error);
    return NextResponse.json({ error: "Failed to update partner profile" }, { status: 500 });
  }
}
