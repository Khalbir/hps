import { NextResponse } from "next/server";
import { partnerStore } from "@/lib/partners/store";
import { generatePartnerId, generatePartnerQrCode, generatePartnerReferralCode } from "@/lib/partners/engine";
import { PartnerCategory, PartnerProfile } from "@/lib/partners/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      companyName,
      email,
      phone,
      category,
      operatingState,
      city,
      address,
      bankName,
      bankAccount,
      accountName,
      estateName,
      totalUnits,
    } = body;

    if (!name || !email || !phone || !category) {
      return NextResponse.json(
        { error: "Full Name, Email address, Phone number, and Partner Category are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if partner already exists
    const existing = await partnerStore.findPartner(cleanEmail);
    if (existing) {
      return NextResponse.json(
        {
          error: "An account with this email already exists in the HandyHub Partner Network.",
          partnerId: existing.partnerId,
          referralCode: existing.referralCode,
        },
        { status: 409 }
      );
    }

    const partnerId = generatePartnerId();
    const referralCode = generatePartnerReferralCode(companyName || name, category as PartnerCategory);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";
    const deepLink = `${baseUrl}/book?partner=${referralCode}`;
    const qrCodeUrl = generatePartnerQrCode(deepLink, (companyName || name).toUpperCase(), partnerId, referralCode);

    const newPartner: PartnerProfile = {
      id: `ptr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partnerId,
      name: name.trim(),
      companyName: companyName?.trim() || undefined,
      email: cleanEmail,
      phone: phone.trim(),
      category: category as PartnerCategory,
      operatingState: operatingState || "FCT",
      city: city || "Abuja",
      address: address || "",
      referralCode,
      qrCodeUrl,
      status: "ACTIVE",
      tierLevel: "BRONZE",
      walletBalance: 0,
      totalEarnings: 0,
      totalWithdrawn: 0,
      bankName: bankName || "",
      bankAccount: bankAccount || "",
      accountName: accountName || name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await partnerStore.savePartner(newPartner);

    // If category is ESTATE_MANAGER, ensure initial Estate is created
    if (category === "ESTATE_MANAGER") {
      const estate = {
        id: `est_${Date.now()}`,
        partnerId: newPartner.id,
        name: estateName?.trim() || companyName?.trim() || `${name.trim()}'s Managed Estate`,
        city: city || "Abuja",
        state: operatingState || "FCT",
        address: address || "Main Estate Gate, District Office",
        totalUnits: Number(totalUnits) || 50,
        occupiedUnits: 0,
        gateSecurityPhone: phone.trim(),
        gatePassRequired: true,
        preferredCategories: ["plumbing", "electrical", "cleaning", "fumigation", "hvac"],
        monthlyServiceVolume: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await partnerStore.saveEstate(estate);
    }

    const redirectPath = category === "ESTATE_MANAGER" ? "/partners/estate" : "/partners/dashboard";

    return NextResponse.json({
      success: true,
      message: "Congratulations! Your partner account is active.",
      partner: newPartner,
      redirect: `${redirectPath}?partnerId=${newPartner.partnerId}&code=${newPartner.referralCode}`,
    });
  } catch (error: any) {
    console.error("[Partner Register API Error]:", error);
    return NextResponse.json(
      { error: "Failed to register partner account. Please try again." },
      { status: 500 }
    );
  }
}
