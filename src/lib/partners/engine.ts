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
  return generateScannableQrSvg(deepLink, {
    label,
    partnerId,
    referralCode,
    subLabel: "SCAN TO BOOK VERIFIED ARTISANS",
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
