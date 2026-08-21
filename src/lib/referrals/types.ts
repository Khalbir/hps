/**
 * HandyHub Pro Solutions — Enterprise Referral & Recruiter Tier Types
 */

export type ReferralProgramType =
  | "ARTISAN_TO_ARTISAN"
  | "CUSTOMER_TO_CUSTOMER"
  | "CUSTOMER_TO_ARTISAN";

export type RecruiterTierLevel =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "AMBASSADOR";

export type NonCashBenefitType =
  | "SERVICE_CREDIT"            // Platform credit applied towards booking total
  | "COMMISSION_DISCOUNT_TOKEN" // 0% or reduced platform fee on future jobs for pro
  | "TOOL_MARKETPLACE_VOUCHER"  // Voucher redeemable in tools/materials store
  | "INSURANCE_BOOST_TOKEN"     // Free warranty/guarantee boost token
  | "EXPRESS_DISPATCH_TOKEN";   // Free urgent dispatch surcharge waiver

export type ReferralStatus =
  | "PENDING_VERIFICATION"
  | "PENDING_FIRST_JOB"
  | "QUALIFIED"
  | "FLAGGED_FRAUD"
  | "REJECTED";

export interface RecruiterTierConfig {
  level: RecruiterTierLevel;
  name: string;
  minReferrals: number;
  multiplier: number;
  badgeColor: string;
  iconName: string;
  perks: string[];
}

export interface NonCashReward {
  id: string;
  recipientId: string;
  programType: ReferralProgramType;
  benefitType: NonCashBenefitType;
  title: string;
  description: string;
  valueNgn: number;           // Face value or monetary equivalence for credit/voucher
  discountPercent?: number;   // e.g. 100% for 0% commission pass
  remainingUses: number;
  expiresAt: string;
  isRedeemed: boolean;
  referenceCode: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ReferralRecordItem {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerRole: string;
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  refereeRole: string;
  programType: ReferralProgramType;
  status: ReferralStatus;
  isVerifiedReferee: boolean;
  hasCompletedFirstJob: boolean;
  firstJobReference?: string | null;
  rewardsIssued: boolean;
  fraudScore: number;
  fraudFlags: string[];
  createdAt: string;
  qualifiedAt?: string | null;
}

export interface ReferralUserSummary {
  referralCode: string;
  referralLink: string;
  qrDataUrl: string;
  currentTier: RecruiterTierConfig;
  nextTier: RecruiterTierConfig | null;
  progressToNextTierPercent: number;
  totalReferralsSent: number;
  totalQualifiedReferrals: number;
  pendingReferralsCount: number;
  totalEstimatedNonCashEarnedNgn: number;
  activeBenefits: {
    serviceCreditBalanceNgn: number;
    activeCommissionPasses: number;
    activeMarketplaceVouchersCount: number;
    activeInsuranceTokensCount: number;
    activeExpressTokensCount: number;
  };
  rewardsVault: NonCashReward[];
  recentActivity: ReferralRecordItem[];
}

export interface ReferralRulesConfig {
  programsEnabled: {
    artisanToArtisan: boolean;
    customerToCustomer: boolean;
    customerToArtisan: boolean;
  };
  artisanToArtisan: {
    referrerCommissionPassJobs: number;
    referrerToolVoucherNgn: number;
    refereeToolVoucherNgn: number;
    refereeCommissionDiscountPercent: number;
    refereeCommissionDiscountJobs: number;
  };
  customerToCustomer: {
    referrerServiceCreditNgn: number;
    referrerExpressTokens: number;
    refereeBookingDiscountNgn: number;
  };
  customerToArtisan: {
    referrerServiceCreditNgn: number;
    referrerVipConciergeUnlocked: boolean;
    refereeCommissionPassJobs: number;
    refereeFastTrackAudit: boolean;
  };
  tiers: Record<RecruiterTierLevel, { minReferrals: number; multiplier: number }>;
  antiFraudRules: {
    maxDailyReferralsPerIp: number;
    blockSelfReferrals: boolean;
    blockMatchingBankAccounts: boolean;
    blockCycleBookings: boolean;
    velocityThresholdPerHour: number;
  };
}

export interface FraudAnalysisResult {
  isFraudulent: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number; // 0 to 100
  flags: string[];
  recommendation: "APPROVE" | "REVIEW" | "BLOCK";
  details: Record<string, any>;
}

export interface AiCampaignRecommendation {
  id: string;
  title: string;
  targetAudience: "ARTISANS" | "CUSTOMERS" | "ALL";
  regionOrZone: string;
  rationale: string;
  suggestedAction: string;
  projectedGrowthPercent: number;
  status: "ACTIVE" | "PROPOSED" | "DISMISSED";
}
