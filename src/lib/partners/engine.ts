/**
 * HandyHub Partner Network — Enterprise Attribution & Commission Engine
 * Orchestrates Partner IDs, branded QR vector generator, permanent attribution,
 * dynamic tiered rev-share calculations, and fraud detection heuristics.
 */

import { PartnerCategory, PartnerCommissionConfig, PartnerTier } from "./types";
import { DEFAULT_PARTNER_CONFIG, PARTNER_TIERS } from "./config";

/**
 * Generates an official, unique Partner ID (e.g. "HHP-PTR-83921")
 */
export function generatePartnerId(): string {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `HHP-PTR-${randomSuffix}`;
}

/**
 * Generates a clean, unique referral code for the partner (e.g. "PTR-SUNNYVALE-94")
 */
export function generatePartnerReferralCode(name: string, category: PartnerCategory): string {
  const cleanName = (name || "PARTNER")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  const prefix = category === "ESTATE_MANAGER" ? "EST" : "PTR";
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${cleanName}-${randomNum}`;
}

import { generateScannableQrSvg } from "@/lib/qr-code";

/**
 * Generates an ISO-compliant SVG vector Data URI for high-res Partner QR codes
 */
export function generatePartnerQrCode(
  deepLink: string,
  label: string = "HANDYHUB PARTNER",
  partnerId?: string,
  referralCode?: string
): string {
  const targetLink = deepLink
    ? deepLink.replace(/\/book\?partner=/g, "/?partner=").replace(/\/book\?/g, "/?")
    : referralCode
    ? `https://handyhubpro.ng/?partner=${referralCode}`
    : "https://handyhubpro.ng";

  return generateScannableQrSvg(targetLink, {
    label,
    partnerId,
    referralCode,
    subLabel: "SCAN TO VISIT HANDYHUB PRO",
  });
}

/**
 * Calculates dynamic commission for a completed job based on config & tier
 */
export function calculateJobCommission(
  jobAmount: number,
  category: PartnerCategory,
  tier: PartnerTier = "BRONZE",
  config: PartnerCommissionConfig = DEFAULT_PARTNER_CONFIG
): {
  baseRatePercent: number;
  tierMultiplier: number;
  commissionNgn: number;
} {
  let baseRatePercent = 5.0;

  switch (category) {
    case "ESTATE_MANAGER":
      baseRatePercent = config.rates.estateManagerBookingPercent;
      break;
    case "REALTOR":
      baseRatePercent = config.rates.realtorBookingPercent;
      break;
    case "INFLUENCER":
      baseRatePercent = config.rates.influencerBookingPercent;
      break;
    case "COMMUNITY_LEADER":
      baseRatePercent = config.rates.communityLeaderBookingPercent;
      break;
    case "CORPORATE_PARTNER":
      baseRatePercent = config.rates.corporatePartnerBookingPercent;
      break;
    case "CONTENT_CREATOR":
      baseRatePercent = config.rates.influencerBookingPercent;
      break;
    default:
      baseRatePercent = 5.0;
  }

  const tierInfo = PARTNER_TIERS[tier] || PARTNER_TIERS.BRONZE;
  const tierMultiplier = tierInfo.multiplier;

  const rawCommission = (jobAmount * (baseRatePercent / 100)) * tierMultiplier;
  const commissionNgn = Math.round(rawCommission);

  return {
    baseRatePercent,
    tierMultiplier,
    commissionNgn,
  };
}

/**
 * Anti-Fraud Sentinel: Checks for self-referral and anomalous booking patterns
 */
export function evaluatePartnerFraudRisk(params: {
  partnerEmail: string;
  partnerPhone: string;
  referredEmail: string;
  referredPhone?: string;
  ipAddress?: string;
  partnerIp?: string;
}): {
  isBlocked: boolean;
  fraudScore: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  const cleanPartnerEmail = (params.partnerEmail || "").toLowerCase().trim();
  const cleanReferredEmail = (params.referredEmail || "").toLowerCase().trim();
  const cleanPartnerPhone = (params.partnerPhone || "").replace(/\D/g, "");
  const cleanReferredPhone = (params.referredPhone || "").replace(/\D/g, "");

  // 1. Exact Email Match (Self-Referral)
  if (cleanPartnerEmail && cleanPartnerEmail === cleanReferredEmail) {
    score += 100;
    reasons.push("Self-referral detected: Partner email matches referred user email.");
  }

  // 2. Exact Phone Match
  if (cleanPartnerPhone && cleanReferredPhone && cleanPartnerPhone === cleanReferredPhone) {
    score += 100;
    reasons.push("Self-referral detected: Partner phone matches referred user phone.");
  }

  // 3. IP Match Heuristic
  if (params.ipAddress && params.partnerIp && params.ipAddress === params.partnerIp) {
    score += 35;
    reasons.push("Same device / IP network detected between partner and referred user.");
  }

  const isBlocked = score >= 50;

  return {
    isBlocked,
    fraudScore: Math.min(100, score),
    reasons,
  };
}

/**
 * Automates real-time Partner Attribution & Commission settlement on booking creation
 */
export async function processPartnerBookingAttribution(params: {
  bookingId: string;
  reference: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  partnerReferralCode?: string;
  serviceName: string;
  serviceCategory: string;
  address?: string;
  ipAddress?: string;
}): Promise<{
  attributed: boolean;
  partnerId?: string;
  commissionNgn: number;
  fraudBlocked?: boolean;
}> {
  try {
    const { partnerStore } = await import("./store");
    const {
      amount,
      customerEmail,
      customerName,
      customerPhone,
      partnerReferralCode,
      serviceName,
      serviceCategory,
      address,
      ipAddress,
    } = params;

    let targetPartner = null;

    // 1. If explicit partner referral code provided
    if (partnerReferralCode) {
      targetPartner = await partnerStore.getPartner(partnerReferralCode);
    }

    // 2. Fallback: check if customer has an existing permanent attribution
    if (!targetPartner && (customerEmail || customerPhone)) {
      const existingAttribution = await partnerStore.findAttributionByEmailOrPhone(customerEmail || customerPhone || "");
      if (existingAttribution) {
        targetPartner = await partnerStore.getPartner(existingAttribution.partnerId);
      }
    }

    if (!targetPartner) {
      return { attributed: false, commissionNgn: 0 };
    }

    // 3. Fraud Evaluation
    const fraud = evaluatePartnerFraudRisk({
      partnerEmail: targetPartner.email,
      partnerPhone: targetPartner.phone,
      referredEmail: customerEmail,
      referredPhone: customerPhone,
      ipAddress,
    });

    if (fraud.isBlocked) {
      console.warn(`[Partner Fraud Blocked]: Referral for ${targetPartner.partnerId} blocked. Score: ${fraud.fraudScore}`);
      return { attributed: false, partnerId: targetPartner.partnerId, commissionNgn: 0, fraudBlocked: true };
    }

    // 4. Calculate Commission
    const config = await partnerStore.getConfig();
    const { commissionNgn } = calculateJobCommission(
      amount,
      targetPartner.category,
      targetPartner.tierLevel,
      config
    );

    // 5. Credit Partner Wallet
    targetPartner.walletBalance += commissionNgn;
    targetPartner.totalEarnings += commissionNgn;
    targetPartner.updatedAt = new Date().toISOString();
    await partnerStore.savePartner(targetPartner);

    // 6. Record / Update Permanent Attribution
    const existingAttributions = await partnerStore.getAttributionsByPartner(targetPartner.partnerId);
    let attr = existingAttributions.find(
      (a) => a.referredEmail && a.referredEmail.toLowerCase().trim() === customerEmail.toLowerCase().trim()
    );

    if (attr) {
      attr.totalJobs += 1;
      attr.totalRevenueNgn += amount;
      attr.totalCommissionEarnedNgn += commissionNgn;
      await partnerStore.saveAttribution(attr);
    } else {
      let attrType: any = "ORGANIC_REFERRAL";
      if (targetPartner.category === "ESTATE_MANAGER") attrType = "ESTATE_RESIDENT";
      else if (targetPartner.category === "REALTOR") attrType = "REALTOR_CLIENT";
      else if (targetPartner.category === "INFLUENCER" || targetPartner.category === "CONTENT_CREATOR") attrType = "INFLUENCER_AUDIENCE";

      await partnerStore.saveAttribution({
        id: `attr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        partnerId: targetPartner.partnerId,
        referralCode: targetPartner.referralCode,
        referredUserRole: "CUSTOMER",
        referredName: customerName,
        referredEmail: customerEmail,
        referredPhone: customerPhone,
        attributionType: attrType,
        totalJobs: 1,
        totalRevenueNgn: amount,
        totalCommissionEarnedNgn: commissionNgn,
        isPermanent: true,
        fraudScore: fraud.fraudScore,
        createdAt: new Date().toISOString(),
      });
    }

    // 7. Estate Management Specific Records
    if (targetPartner.category === "ESTATE_MANAGER") {
      const estates = await partnerStore.getEstatesByPartner(targetPartner.partnerId);
      const mainEstate = estates[0] || {
        id: `est_${Date.now()}`,
        partnerId: targetPartner.partnerId,
        name: targetPartner.companyName || `${targetPartner.name} Estate`,
        city: targetPartner.city || "Abuja",
        state: targetPartner.operatingState || "FCT",
        address: targetPartner.address || "Estate Facility Office",
        totalUnits: 100,
        gatePassRequired: true,
        preferredCategories: ["plumbing", "electrical", "cleaning", "fumigation"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save service request in estate dashboard
      await partnerStore.saveServiceRequest({
        id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        estateId: mainEstate.id,
        estateName: mainEstate.name,
        unitNumber: address || "Resident Property Unit",
        residentName: customerName,
        residentPhone: customerPhone || "Not Provided",
        serviceCategory: serviceCategory || "Home Service",
        serviceName: serviceName || "General Maintenance",
        status: "PENDING",
        amount,
        commissionEarned: commissionNgn,
        scheduledDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      // Update resident record in estate
      const residents = await partnerStore.getResidentsByPartner(targetPartner.partnerId);
      let resItem = residents.find(
        (r) => (customerPhone && r.phone === customerPhone) || (r.email && r.email.toLowerCase() === customerEmail.toLowerCase())
      );
      if (resItem) {
        resItem.totalBookings += 1;
        resItem.totalSpendNgn += amount;
        resItem.lastBookingDate = new Date().toISOString();
        await partnerStore.saveResident(resItem);
      } else {
        await partnerStore.saveResident({
          id: `res_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          estateId: mainEstate.id,
          partnerId: targetPartner.partnerId,
          residentName: customerName,
          unitNumber: address || "Unit Apt",
          phone: customerPhone || "08000000000",
          email: customerEmail,
          status: "ACTIVE",
          totalBookings: 1,
          totalSpendNgn: amount,
          lastBookingDate: new Date().toISOString(),
          joinedAt: new Date().toISOString(),
        });
      }
    }

    return {
      attributed: true,
      partnerId: targetPartner.partnerId,
      commissionNgn,
      fraudBlocked: false,
    };
  } catch (err) {
    console.error("[Partner Booking Attribution Error]:", err);
    return { attributed: false, commissionNgn: 0 };
  }
}
