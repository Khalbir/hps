import { RecruiterTierConfig, RecruiterTierLevel, ReferralRulesConfig } from "./types";

export const RECRUITER_TIERS: Record<RecruiterTierLevel, RecruiterTierConfig> = {
  BRONZE: {
    level: "BRONZE",
    name: "Bronze Recruiter",
    minReferrals: 0,
    multiplier: 1.0,
    badgeColor: "#CD7F32",
    iconName: "Award",
    perks: [
      "1.0x Standard Non-Cash Reward Multiplier",
      "Bronze Recruiter Digital Crest",
      "Standard Platform Perks",
    ],
  },
  SILVER: {
    level: "SILVER",
    name: "Silver Recruiter",
    minReferrals: 4,
    multiplier: 1.15,
    badgeColor: "#94A3B8",
    iconName: "ShieldCheck",
    perks: [
      "1.15x Non-Cash Reward Multiplier (+15% Voucher Value)",
      "Silver Recruiter Digital Badge",
      "5% Bonus Platform Service Credits",
      "Priority Review for Referee Audits",
    ],
  },
  GOLD: {
    level: "GOLD",
    name: "Gold Recruiter",
    minReferrals: 10,
    multiplier: 1.3,
    badgeColor: "#F59E0B",
    iconName: "Star",
    perks: [
      "1.30x Non-Cash Reward Multiplier (+30% Voucher Value)",
      "Gold Recruiter Digital Crest",
      "Priority Dispatch Allocation on High-Demand Jobs",
      "10% Extra Tool & Equipment Vouchers",
      "Dedicated Verification Officer Queue",
    ],
  },
  PLATINUM: {
    level: "PLATINUM",
    name: "Platinum Recruiter",
    minReferrals: 25,
    multiplier: 1.5,
    badgeColor: "#00C4D4",
    iconName: "Zap",
    perks: [
      "1.50x Non-Cash Reward Multiplier (+50% Benefit Value)",
      "Platinum Recruiter Digital Badge",
      "VIP Support Concierge (Direct Fast-Track Resolution)",
      "Annual Free Tool & Equipment Insurance Token",
      "Guaranteed Zero-Commission Pass on Peak Holiday Weekends",
    ],
  },
  AMBASSADOR: {
    level: "AMBASSADOR",
    name: "HandyHub Ambassador",
    minReferrals: 50,
    multiplier: 2.0,
    badgeColor: "#8B5CF6",
    iconName: "Crown",
    perks: [
      "2.00x Maximum Double Multiplier on All Non-Cash Rewards",
      "Supreme HandyHub Ambassador Digital Crest",
      "Direct Executive Operations Hotline Access",
      "Unlimited Zero-Commission Weekend Passes",
      "Quarterly Platform Milestone Dividend Credit Grants",
      "Honorary Executive Advisory Board Membership",
    ],
  },
};

export const DEFAULT_REFERRAL_RULES: ReferralRulesConfig = {
  programsEnabled: {
    artisanToArtisan: true,
    customerToCustomer: true,
    customerToArtisan: true,
  },
  artisanToArtisan: {
    referrerCommissionPassJobs: 2,
    referrerToolVoucherNgn: 5000,
    refereeToolVoucherNgn: 3000,
    refereeCommissionDiscountPercent: 50,
    refereeCommissionDiscountJobs: 3,
  },
  customerToCustomer: {
    referrerServiceCreditNgn: 2500,
    referrerExpressTokens: 1,
    refereeBookingDiscountNgn: 2000,
  },
  customerToArtisan: {
    referrerServiceCreditNgn: 5000,
    referrerVipConciergeUnlocked: true,
    refereeCommissionPassJobs: 2,
    refereeFastTrackAudit: true,
  },
  tiers: {
    BRONZE: { minReferrals: 0, multiplier: 1.0 },
    SILVER: { minReferrals: 4, multiplier: 1.15 },
    GOLD: { minReferrals: 10, multiplier: 1.3 },
    PLATINUM: { minReferrals: 25, multiplier: 1.5 },
    AMBASSADOR: { minReferrals: 50, multiplier: 2.0 },
  },
  antiFraudRules: {
    maxDailyReferralsPerIp: 5,
    blockSelfReferrals: true,
    blockMatchingBankAccounts: true,
    blockCycleBookings: true,
    velocityThresholdPerHour: 6,
  },
};

/**
 * Calculate user tier based on qualified referral count
 */
export function calculateTier(qualifiedCount: number): RecruiterTierConfig {
  if (qualifiedCount >= RECRUITER_TIERS.AMBASSADOR.minReferrals) return RECRUITER_TIERS.AMBASSADOR;
  if (qualifiedCount >= RECRUITER_TIERS.PLATINUM.minReferrals) return RECRUITER_TIERS.PLATINUM;
  if (qualifiedCount >= RECRUITER_TIERS.GOLD.minReferrals) return RECRUITER_TIERS.GOLD;
  if (qualifiedCount >= RECRUITER_TIERS.SILVER.minReferrals) return RECRUITER_TIERS.SILVER;
  return RECRUITER_TIERS.BRONZE;
}

/**
 * Get next tier to unlock
 */
export function getNextTier(currentLevel: RecruiterTierLevel): RecruiterTierConfig | null {
  switch (currentLevel) {
    case "BRONZE":
      return RECRUITER_TIERS.SILVER;
    case "SILVER":
      return RECRUITER_TIERS.GOLD;
    case "GOLD":
      return RECRUITER_TIERS.PLATINUM;
    case "PLATINUM":
      return RECRUITER_TIERS.AMBASSADOR;
    case "AMBASSADOR":
      return null;
  }
}
