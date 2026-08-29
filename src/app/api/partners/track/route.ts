import { NextResponse } from "next/server";
import { partnerStore } from "@/lib/partners/store";
import { calculateJobCommission, evaluatePartnerFraudRisk } from "@/lib/partners/engine";
import { PartnerAttribution } from "@/lib/partners/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      referralCode,
      referredUserId,
      referredUserRole, // CUSTOMER or PROFESSIONAL
      referredName,
      referredEmail,
      referredPhone,
      jobAmount,
      isJobCompleted,
      ipAddress,
    } = body;

    if (!referralCode || !referredEmail) {
      return NextResponse.json(
        { error: "Referral code and referred user email are required." },
        { status: 400 }
      );
    }

    const partner = await partnerStore.findPartner(referralCode);
    if (!partner) {
      return NextResponse.json(
        { error: `Partner referral code ${referralCode} not found.` },
        { status: 404 }
      );
    }

    // Run Fraud Check
    const fraudCheck = evaluatePartnerFraudRisk({
      partnerEmail: partner.email,
      partnerPhone: partner.phone,
      referredEmail,
      referredPhone,
      ipAddress,
    });

    if (fraudCheck.isBlocked) {
      return NextResponse.json(
        {
          error: "Referral attribution rejected by Fraud Sentinel.",
          fraudScore: fraudCheck.fraudScore,
          reasons: fraudCheck.reasons,
        },
        { status: 403 }
      );
    }

    const config = await partnerStore.getConfig();
    let commissionEarned = 0;
    const amount = Number(jobAmount) || 0;

    if (isJobCompleted && amount > 0) {
      const calc = calculateJobCommission(amount, partner.category, partner.tierLevel, config);
      commissionEarned = calc.commissionNgn;
    } else if (!isJobCompleted && referredUserRole === "PROFESSIONAL") {
      // Pro signup bonus
      commissionEarned = 0;
    }

    const attribution: PartnerAttribution = {
      id: `attr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partnerId: partner.id,
      referralCode: partner.referralCode,
      referredUserId,
      referredUserRole: referredUserRole === "PROFESSIONAL" ? "PROFESSIONAL" : "CUSTOMER",
      referredName: referredName || "Referred User",
      referredEmail: referredEmail.toLowerCase().trim(),
      referredPhone,
      attributionType:
        partner.category === "ESTATE_MANAGER"
          ? "ESTATE_RESIDENT"
          : partner.category === "REALTOR"
          ? "REALTOR_CLIENT"
          : referredUserRole === "PROFESSIONAL"
          ? "ARTISAN_RECRUIT"
          : "ORGANIC_REFERRAL",
      totalJobs: isJobCompleted ? 1 : 0,
      totalRevenueNgn: amount,
      totalCommissionEarnedNgn: commissionEarned,
      isPermanent: true,
      fraudScore: fraudCheck.fraudScore,
      createdAt: new Date().toISOString(),
    };

    await partnerStore.saveAttribution(attribution);

    // If commission was earned on this event, credit the partner wallet
    if (commissionEarned > 0) {
      const updatedPartner = {
        ...partner,
        walletBalance: partner.walletBalance + commissionEarned,
        totalEarnings: partner.totalEarnings + commissionEarned,
        updatedAt: new Date().toISOString(),
      };
      await partnerStore.savePartner(updatedPartner);
    }

    return NextResponse.json({
      success: true,
      message: `User permanently attributed to partner ${partner.name} (${partner.partnerId}).`,
      attribution,
      commissionEarned,
    });
  } catch (error: any) {
    console.error("[Partner Track API Error]:", error);
    return NextResponse.json({ error: "Failed to attribute referral" }, { status: 500 });
  }
}
