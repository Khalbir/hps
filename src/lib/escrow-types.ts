/**
 * Escrow & Commission Configuration Types and Default Settings
 * Safe for import in both Client and Server components (Zero Node.js runtime dependencies)
 */

export interface CommissionRulesConfig {
  defaultRatePercent: number; // e.g. 20 for 20%
  categoryRates: Record<string, number>; // e.g. { "cleaning": 20, "solar": 10, "plumbing": 18, "electrical": 18, "painting": 15 }
  escrowHoldHours: number; // e.g. 24 hours dispute protection
  minWithdrawalNgn: number; // e.g. 2000
  maxDailyWithdrawalNgn: number; // e.g. 500000
  isAutoReleaseEnabled: boolean; // Auto-release on OTP or completion
  updatedAt?: string;
}

export const DEFAULT_COMMISSION_RULES: CommissionRulesConfig = {
  defaultRatePercent: 20,
  categoryRates: {
    cleaning: 20,
    plumbing: 18,
    electrical: 18,
    painting: 15,
    hvac: 15,
    security: 15,
    solar: 10,
    carpentry: 18,
    "home-improvement": 12,
    outdoor: 15,
    laundry: 15,
    moving: 12,
    general: 15,
  },
  escrowHoldHours: 24,
  minWithdrawalNgn: 2000,
  maxDailyWithdrawalNgn: 500000,
  isAutoReleaseEnabled: true,
};

export interface CommissionBreakdown {
  totalAmountNgn: number;
  categorySlug: string;
  commissionRatePercent: number;
  commissionAmountNgn: number;
  proNetEarningsNgn: number;
  escrowHoldHours: number;
}
