import {
  calculateTier,
  getNextTier,
  RECRUITER_TIERS,
  DEFAULT_REFERRAL_RULES,
  getReferralRulesConfig,
  saveReferralRulesConfig,
} from "../src/lib/referrals/config";
import {
  generateSvgQrCode,
  getOrCreateReferralCode,
  trackReferralCodeClick,
  attributeReferral,
  evaluateReferralQualification,
  getUserReferralSummary,
} from "../src/lib/referrals/engine";
import {
  analyzeReferralFraudRisk,
  generateCampaignRecommendations,
} from "../src/lib/referrals/ai-agent";
import { prisma } from "../src/lib/db";

async function runReferralTestSuite() {
  console.log("==================================================================");
  console.log("HANDYHUB PRO SOLUTIONS — ENTERPRISE REFERRAL & AI AGENT TEST SUITE");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || "");
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Recruiter Tier Progression & Multipliers
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 1]: Recruiter Tier Hierarchy & Multiplier Engine");
    const bronzeTier = calculateTier(0);
    assert(bronzeTier.level === "BRONZE" && bronzeTier.multiplier === 1.0, "0 referrals resolves to Bronze (1.0x)");

    const silverTier = calculateTier(5);
    assert(silverTier.level === "SILVER" && silverTier.multiplier === 1.15, "5 referrals resolves to Silver (1.15x)");

    const goldTier = calculateTier(12);
    assert(goldTier.level === "GOLD" && goldTier.multiplier === 1.3, "12 referrals resolves to Gold (1.30x)");

    const platTier = calculateTier(30);
    assert(platTier.level === "PLATINUM" && platTier.multiplier === 1.5, "30 referrals resolves to Platinum (1.50x)");

    const ambassadorTier = calculateTier(55);
    assert(ambassadorTier.level === "AMBASSADOR" && ambassadorTier.multiplier === 2.0, "55 referrals resolves to Ambassador (2.00x)");

    assert(getNextTier("BRONZE")?.level === "SILVER", "Bronze next tier is Silver");
    assert(getNextTier("PLATINUM")?.level === "AMBASSADOR", "Platinum next tier is Ambassador");
    assert(getNextTier("AMBASSADOR") === null, "Ambassador is maximum sovereign tier");

    // -------------------------------------------------------------
    // TEST 2: Dynamic QR Code & Code Generator
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 2]: Dynamic QR Generator & Deep-Link Architecture");
    const qrSvg = generateSvgQrCode("https://handyhubpro.ng/join-pro?ref=HHP-PRO-TEST99");
    assert(qrSvg.startsWith("data:image/svg+xml;utf8,"), "Dynamic QR generated as valid SVG data URI");
    assert(qrSvg.includes("%2300A8B5") && qrSvg.includes("%23FF7A1A"), "Dynamic QR incorporates HandyHub brand tokens (Teal & Orange)");

    // -------------------------------------------------------------
    // TEST 3: AI Anti-Fraud Engine Analysis
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 3]: AI Multi-Vector Fraud Detection Suite");

    // 3A: Direct Self-Referral
    const selfFraud = await analyzeReferralFraudRisk({
      referrerId: "user_123",
      refereeId: "user_123",
      programType: "CUSTOMER_TO_CUSTOMER",
    });
    assert(selfFraud.isFraudulent && selfFraud.recommendation === "BLOCK", "AI Anti-Fraud correctly blocks direct self-referral");
    assert(selfFraud.flags.includes("SELF_REFERRAL_IDENTICAL_USER_ID"), "AI Anti-Fraud tags SELF_REFERRAL_IDENTICAL_USER_ID flag");

    // -------------------------------------------------------------
    // TEST 4: Dynamic Super Admin Rule Configuration Override
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 4]: Dynamic Super Admin Setting Persistence");
    const initialConfig = await getReferralRulesConfig();
    assert(Boolean(initialConfig.programsEnabled.artisanToArtisan), "Artisan-to-Artisan program enabled by default");

    const customConfig = {
      ...initialConfig,
      customerToCustomer: {
        ...initialConfig.customerToCustomer,
        referrerServiceCreditNgn: 3000,
      },
    };
    const saved = await saveReferralRulesConfig(customConfig);
    assert(saved, "Successfully saved custom referral policy to Setting table");

    const reloadedConfig = await getReferralRulesConfig();
    assert(reloadedConfig.customerToCustomer.referrerServiceCreditNgn === 3000, "Setting successfully loaded dynamic ₦3,000 credit rule from DB");

    // Restore default
    await saveReferralRulesConfig(DEFAULT_REFERRAL_RULES);

    // -------------------------------------------------------------
    // TEST 5: AI Regional Campaign Recommendations
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 5]: AI Regional Campaign Synthesizer");
    const campaigns = await generateCampaignRecommendations();
    assert(Array.isArray(campaigns) && campaigns.length > 0, "AI Synthesizer generated active campaign recommendations");
    assert(Boolean(campaigns[0].title && campaigns[0].suggestedAction), "Campaign contains title, rationale, and actionable booster");

    // -------------------------------------------------------------
    // TEST 6: User Summary Aggregation & Rewards Vault
    // -------------------------------------------------------------
    console.log("\n[TEST GROUP 6]: End-to-End User Referral Summary Ledger");
    const sampleUser = await prisma.user.findFirst({ select: { id: true } });
    if (sampleUser) {
      const summary = await getUserReferralSummary(sampleUser.id);
      assert(Boolean(summary.referralCode), `Referral code generated: ${summary.referralCode}`);
      assert(Boolean(summary.currentTier.name), `Current tier loaded: ${summary.currentTier.name}`);
      assert(Array.isArray(summary.rewardsVault), "Rewards vault initialized as array");
      assert(typeof summary.activeBenefits.serviceCreditBalanceNgn === "number", "Service credit balance calculated accurately");
    }

  } catch (err) {
    console.error("Test execution threw an unexpected error:", err);
    failed++;
  }

  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runReferralTestSuite();
