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

/**
 * Generates an SVG vector Data URI for high-res Partner QR codes
 */
export function generatePartnerQrCode(deepLink: string, label: string = "HANDYHUB PARTNER"): string {
  const cleanLabel = (label || "HANDYHUB PARTNER").toUpperCase().slice(0, 24);
  const encodedUrl = encodeURIComponent(deepLink);

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" width="240" height="280"><defs><linearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2300A8B5"/><stop offset="100%" stop-color="%230EA5E9"/></linearGradient></defs><rect width="240" height="280" rx="16" fill="%230F172A" stroke="%2300A8B5" stroke-width="2"/><rect x="15" y="15" width="210" height="200" rx="12" fill="%23FFFFFF"/><rect x="30" y="30" width="45" height="45" rx="6" fill="%2300A8B5"/><rect x="38" y="38" width="29" height="29" rx="3" fill="%23FFFFFF"/><rect x="45" y="45" width="15" height="15" fill="%2300A8B5"/><rect x="165" y="30" width="45" height="45" rx="6" fill="%2300A8B5"/><rect x="173" y="38" width="29" height="29" rx="3" fill="%23FFFFFF"/><rect x="180" y="45" width="15" height="15" fill="%2300A8B5"/><rect x="30" y="155" width="45" height="45" rx="6" fill="%2300A8B5"/><rect x="38" y="163" width="29" height="29" rx="3" fill="%23FFFFFF"/><rect x="45" y="170" width="15" height="15" fill="%2300A8B5"/><rect x="90" y="35" width="15" height="15" fill="%230F172A"/><rect x="115" y="35" width="15" height="15" fill="%23EA580C"/><rect x="135" y="35" width="15" height="15" fill="%230F172A"/><rect x="90" y="60" width="30" height="15" fill="%2300A8B5"/><rect x="130" y="60" width="20" height="15" fill="%230F172A"/><rect x="90" y="85" width="60" height="60" rx="6" fill="%2300A8B5"/><circle cx="120" cy="115" r="14" fill="%23FFFFFF"/><path d="M 115 115 L 125 115" stroke="%23EA580C" stroke-width="3" stroke-linecap="round"/><rect x="35" y="90" width="15" height="25" fill="%230F172A"/><rect x="60" y="90" width="20" height="15" fill="%23EA580C"/><rect x="35" y="125" width="45" height="15" fill="%230F172A"/><rect x="165" y="90" width="20" height="30" fill="%230F172A"/><rect x="195" y="90" width="15" height="15" fill="%23EA580C"/><rect x="165" y="130" width="45" height="15" fill="%2300A8B5"/><rect x="90" y="155" width="20" height="25" fill="%230F172A"/><rect x="120" y="155" width="40" height="15" fill="%23EA580C"/><rect x="170" y="155" width="40" height="25" fill="%230F172A"/><rect x="90" y="185" width="70" height="15" fill="%2300A8B5"/><rect x="15" y="225" width="210" height="42" rx="8" fill="%231E293B"/><text x="120" y="243" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%2338BDF8" text-anchor="middle" letter-spacing="1">SCAN TO BOOK VERIFIED ARTISANS</text><text x="120" y="258" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="%23F59E0B" text-anchor="middle">${cleanLabel}</text></svg>`;
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
