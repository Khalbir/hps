import { ReferralRulesConfig } from "./types";
import { prisma } from "@/lib/db";
import { DEFAULT_REFERRAL_RULES } from "./constants";

export * from "./constants";

const SETTING_KEY = "setting_referral_rules_config";

/**
 * Loads current referral rules from PostgreSQL Setting table or defaults
 */
export async function getReferralRulesConfig(): Promise<ReferralRulesConfig> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });
    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      return {
        ...DEFAULT_REFERRAL_RULES,
        ...parsed,
        programsEnabled: { ...DEFAULT_REFERRAL_RULES.programsEnabled, ...(parsed.programsEnabled || {}) },
        artisanToArtisan: { ...DEFAULT_REFERRAL_RULES.artisanToArtisan, ...(parsed.artisanToArtisan || {}) },
        customerToCustomer: { ...DEFAULT_REFERRAL_RULES.customerToCustomer, ...(parsed.customerToCustomer || {}) },
        customerToArtisan: { ...DEFAULT_REFERRAL_RULES.customerToArtisan, ...(parsed.customerToArtisan || {}) },
        tiers: { ...DEFAULT_REFERRAL_RULES.tiers, ...(parsed.tiers || {}) },
        antiFraudRules: { ...DEFAULT_REFERRAL_RULES.antiFraudRules, ...(parsed.antiFraudRules || {}) },
      };
    }
  } catch (err) {
    console.warn("[Referral Rules Load Warning]:", err);
  }
  return DEFAULT_REFERRAL_RULES;
}

/**
 * Saves updated referral rules to PostgreSQL Setting table
 */
export async function saveReferralRulesConfig(rules: ReferralRulesConfig): Promise<boolean> {
  try {
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(rules) },
      create: { key: SETTING_KEY, value: JSON.stringify(rules) },
    });
    return true;
  } catch (err) {
    console.error("[Referral Rules Save Error]:", err);
    return false;
  }
}
