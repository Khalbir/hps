/**
 * HandyHub Partner Network — Configuration & Metadata
 */

import { PartnerCategory, PartnerCommissionConfig, PartnerTier } from "./types";

export const PARTNER_CATEGORIES_METADATA: Record<
  PartnerCategory,
  {
    label: string;
    description: string;
    iconName: string;
    badgeColor: string;
    defaultRateDisplay: string;
    keyBenefits: string[];
  }
> = {
  ESTATE_MANAGER: {
    label: "Estate & Facility Manager",
    description: "For residential estates, gated communities, commercial plazas & facility management firms.",
    iconName: "Building2",
    badgeColor: "#00A8B5",
    defaultRateDisplay: "5.0% Rev-Share + ₦1,000 / Verified Resident",
    keyBenefits: [
      "5% continuous revenue-share on all resident service bookings",
      "₦1,000 instant activation bonus per onboarded verified resident unit",
      "Automated gate pass security verification for artisans entering the estate",
      "Consolidated estate maintenance reports and monthly financial audit PDF",
      "Dedicated senior facility account manager & emergency dispatch SLA (<20 min)"
    ],
  },
  REALTOR: {
    label: "Realtor & Property Broker",
    description: "For real estate agents, property developers, leasing managers & short-let hosts.",
    iconName: "Home",
    badgeColor: "#EA580C",
    defaultRateDisplay: "6.0% Move-in Setup + 3% Recurring (12 Mo)",
    keyBenefits: [
      "6% commission on move-in deep cleaning, painting, POP finishing & locks",
      "3% recurring commission for 12 months on all subsequent tenant bookings",
      "Custom branded onboarding QR cards for tenant welcome packs",
      "Priority artisan booking for property inspection punch-lists",
      "Automated Paystack bank deposits on the 1st of every calendar month"
    ],
  },
  INFLUENCER: {
    label: "Influencer & Content Creator",
    description: "For lifestyle, home decor, DIY, tech, and neighborhood community creators.",
    iconName: "Sparkles",
    badgeColor: "#8B5CF6",
    defaultRateDisplay: "4.0% Rev-Share + ₦500 First-Job Bonus",
    keyBenefits: [
      "4% commission on every booking made using your custom code or QR link",
      "₦500 instant cash bonus when each new follower completes their first job",
      "Personalized vanity referral code (e.g. PTR-YOURNAME)",
      "High-res vector SVG QR code generator for video overlays and bio links",
      "Real-time analytics dashboard tracking impressions, clicks & commissions"
    ],
  },
  COMMUNITY_LEADER: {
    label: "Community Leader & CDA Chairman",
    description: "For Community Development Associations (CDA), street committees & village heads.",
    iconName: "Users",
    badgeColor: "#10B981",
    defaultRateDisplay: "5.0% Neighborhood Rev-Share",
    keyBenefits: [
      "5% community revenue share deposited into CDA infrastructure funds",
      "Vetted & background-checked artisan security roster for community peace of mind",
      "Subsidized rates for communal drain clearing, fumigation & streetlight repairs",
      "Direct WhatsApp concierge helpline for community emergency repairs"
    ],
  },
  CORPORATE_PARTNER: {
    label: "Corporate & Business Partner",
    description: "For co-working hubs, banks, telecom centers, retail chains & logistics hubs.",
    iconName: "Briefcase",
    badgeColor: "#0EA5E9",
    defaultRateDisplay: "7.5% Fleet Volume Share",
    keyBenefits: [
      "7.5% volume commission on all enterprise facility management maintenance",
      "Single consolidated monthly e-invoicing with escrow audit trail",
      "Multi-location technician dispatch across Abuja, Lagos & 36 Nigerian states",
      "Dedicated corporate SLA with insured 14-day workmanship guarantee"
    ],
  },
  CONTENT_CREATOR: {
    label: "Digital Creator & Affiliate",
    description: "For bloggers, newsletter publishers, podcast hosts & real estate podcasters.",
    iconName: "Video",
    badgeColor: "#EC4899",
    defaultRateDisplay: "4.0% Commission + ₦2,500 / Pro Recruit",
    keyBenefits: [
      "4% recurring booking commission on all referred customers",
      "₦2,500 recruitment bonus for every background-verified artisan enrolled",
      "Deep link creator toolkit with customizable campaign query params",
      "Transparent multi-attribution tracking with lifetime cookie persistence"
    ],
  },
};

export const DEFAULT_PARTNER_CONFIG: PartnerCommissionConfig = {
  id: "cfg_partner_default",
  rates: {
    estateManagerBookingPercent: 5.0,
    estateManagerResidentBonusNgn: 1000,
    realtorBookingPercent: 6.0,
    realtorMoveInBonusNgn: 2000,
    influencerBookingPercent: 4.0,
    influencerFirstBookingBonusNgn: 500,
    communityLeaderBookingPercent: 5.0,
    corporatePartnerBookingPercent: 7.5,
    artisanRecruitmentBonusNgn: 2500,
  },
  tierMultipliers: {
    bronze: 1.0,
    silver: 1.15,
    gold: 1.3,
    platinum: 1.5,
  },
  payoutRules: {
    minimumPayoutNgn: 10000,
    monthlyPayoutDay: 1,
    autoPayoutEnabled: true,
    requireBankVerification: true,
    maxFraudRiskScore: 25,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "SYSTEM_SUPER_ADMIN",
};

export const PARTNER_TIERS: Record<
  PartnerTier,
  {
    label: string;
    minMonthlyBookings: number;
    multiplier: number;
    color: string;
    perk: string;
  }
> = {
  BRONZE: {
    label: "Bronze Partner",
    minMonthlyBookings: 0,
    multiplier: 1.0,
    color: "#CD7F32",
    perk: "Standard commission rates & monthly payout settlement",
  },
  SILVER: {
    label: "Silver Partner",
    minMonthlyBookings: 25,
    multiplier: 1.15,
    color: "#94A3B8",
    perk: "1.15x Commission Multiplier + Bi-weekly payout option",
  },
  GOLD: {
    label: "Gold Partner",
    minMonthlyBookings: 75,
    multiplier: 1.3,
    color: "#F59E0B",
    perk: "1.30x Commission Multiplier + Dedicated Account Manager + Weekly Payouts",
  },
  PLATINUM: {
    label: "Platinum Partner",
    minMonthlyBookings: 150,
    multiplier: 1.5,
    color: "#00A8B5",
    perk: "1.50x Commission Multiplier + Instant On-Demand Escrow Withdrawals + Custom Co-Branding",
  },
};

export function calculatePartnerTier(monthlyBookings: number): PartnerTier {
  if (monthlyBookings >= 150) return "PLATINUM";
  if (monthlyBookings >= 75) return "GOLD";
  if (monthlyBookings >= 25) return "SILVER";
  return "BRONZE";
}
