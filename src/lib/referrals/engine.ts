/**
 * HandyHub Pro Solutions — Enterprise Referral Engine
 * Orchestrates code generation, tracking, multi-channel qualification, non-cash benefit issuance, and tier progress.
 */

import { prisma } from "@/lib/db";
import {
  ReferralProgramType,
  ReferralUserSummary,
  NonCashReward,
  ReferralRecordItem,
} from "./types";
import {
  getReferralRulesConfig,
  RECRUITER_TIERS,
  calculateTier,
  getNextTier,
} from "./config";
import {
  analyzeReferralFraudRisk,
  dispatchMilestoneNotification,
} from "./ai-agent";

import { generateScannableQrSvg } from "@/lib/qr-code";

/**
 * Generates an ISO-compliant SVG Data URI for client-side QR display
 */
export function generateSvgQrCode(dataText: string, label: string = "HANDYHUB REFERRAL"): string {
  return generateScannableQrSvg(dataText, {
    label,
    subLabel: "SCAN TO CLAIM ₦2,000 VOUCHER",
  });
}

/**
 * Retrieves or creates a unique Referral Code for a user
 */
export async function getOrCreateReferralCode(userId: string): Promise<{
  code: string;
  link: string;
  qrDataUrl: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { professional: true },
  });

  if (!user) throw new Error("User not found");

  let referralCode = await prisma.referralCode.findFirst({
    where: { userId },
  });

  if (!referralCode) {
    const isPro = user.role === "PROFESSIONAL" || Boolean(user.professional);
    const prefix = isPro ? "PRO" : "REF";
    const cleanName = (user.firstName || "USER")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `HHP-${prefix}-${cleanName}${randomSuffix}`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";
    const referralLink = isPro
      ? `${baseUrl}/join-pro?ref=${generatedCode}`
      : `${baseUrl}/book?ref=${generatedCode}`;

    referralCode = await prisma.referralCode.create({
      data: {
        userId,
        code: generatedCode,
        qrPayload: referralLink,
      },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";
  const isPro = user.role === "PROFESSIONAL" || Boolean(user.professional);
  const link = isPro
    ? `${baseUrl}/join-pro?ref=${referralCode.code}`
    : `${baseUrl}/book?ref=${referralCode.code}`;

  return {
    code: referralCode.code,
    link,
    qrDataUrl: generateSvgQrCode(link),
  };
}

/**
 * Tracks link click or QR scan
 */
export async function trackReferralCodeClick(code: string, ipAddress?: string): Promise<boolean> {
  try {
    const refCode = await prisma.referralCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!refCode) return false;

    await prisma.referralCode.update({
      where: { id: refCode.id },
      data: { clickCount: { increment: 1 } },
    });

    await prisma.referralAuditLog.create({
      data: {
        actorRole: "USER",
        action: "CLICK_TRACKED",
        details: JSON.stringify({ code: refCode.code, ipAddress }),
        ipAddress: ipAddress || null,
      },
    });

    return true;
  } catch (err) {
    console.warn("[Track Referral Click Warning]:", err);
    return false;
  }
}

/**
 * Attributes a newly registered user or prospective artisan to a referrer
 */
export async function attributeReferral(params: {
  referrerCode: string;
  refereeUserId: string;
  programType?: ReferralProgramType;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ success: boolean; recordId?: string; error?: string }> {
  const { referrerCode, refereeUserId, ipAddress, userAgent } = params;

  try {
    const cleanCode = referrerCode.trim().toUpperCase();
    const refCodeRecord = await prisma.referralCode.findUnique({
      where: { code: cleanCode },
      include: { user: { include: { professional: true } } },
    });

    if (!refCodeRecord || !refCodeRecord.isActive) {
      return { success: false, error: "Invalid or inactive referral code." };
    }

    const referrerId = refCodeRecord.userId;
    const referee = await prisma.user.findUnique({
      where: { id: refereeUserId },
      include: { professional: true },
    });

    if (!referee) {
      return { success: false, error: "Referee user not found." };
    }

    // Determine default program type if not passed
    let programType: ReferralProgramType = params.programType || "CUSTOMER_TO_CUSTOMER";
    const isReferrerPro = refCodeRecord.user.role === "PROFESSIONAL" || Boolean(refCodeRecord.user.professional);
    const isRefereePro = referee.role === "PROFESSIONAL" || Boolean(referee.professional);

    if (isReferrerPro && isRefereePro) {
      programType = "ARTISAN_TO_ARTISAN";
    } else if (!isReferrerPro && isRefereePro) {
      programType = "CUSTOMER_TO_ARTISAN";
    } else {
      programType = "CUSTOMER_TO_CUSTOMER";
    }

    // Run AI Anti-Fraud Evaluation
    const fraudEval = await analyzeReferralFraudRisk({
      referrerId,
      refereeId: refereeUserId,
      ipAddress,
      userAgent,
      programType,
    });

    if (fraudEval.recommendation === "BLOCK") {
      await prisma.referralAuditLog.create({
        data: {
          actorId: refereeUserId,
          actorRole: "AI_AGENT",
          action: "FRAUD_FLAGGED",
          details: JSON.stringify({
            code: cleanCode,
            riskScore: fraudEval.riskScore,
            flags: fraudEval.flags,
            recommendation: "BLOCK",
          }),
          ipAddress: ipAddress || null,
        },
      });
      return {
        success: false,
        error: `Referral validation restricted: ${fraudEval.flags.join(", ")}`,
      };
    }

    // Check existing referral
    const existing = await prisma.referralRecord.findFirst({
      where: { refereeId: refereeUserId },
    });

    if (existing) {
      return { success: true, recordId: existing.id };
    }

    const initialStatus = referee.isVerified ? "PENDING_FIRST_JOB" : "PENDING_VERIFICATION";

    const record = await prisma.referralRecord.create({
      data: {
        referralCodeId: refCodeRecord.id,
        referrerId,
        refereeId: refereeUserId,
        programType,
        status: initialStatus,
        isVerifiedReferee: referee.isVerified,
        fraudScore: fraudEval.riskScore,
        fraudFlags: JSON.stringify(fraudEval.flags),
      },
    });

    await prisma.referralCode.update({
      where: { id: refCodeRecord.id },
      data: { signupCount: { increment: 1 } },
    });

    await prisma.referralAuditLog.create({
      data: {
        referralRecordId: record.id,
        actorId: refereeUserId,
        actorRole: "USER",
        action: "ATTRIBUTED",
        details: JSON.stringify({
          programType,
          initialStatus,
          riskScore: fraudEval.riskScore,
        }),
        ipAddress: ipAddress || null,
      },
    });

    return { success: true, recordId: record.id };
  } catch (err: any) {
    console.error("[Attribute Referral Error]:", err);
    return { success: false, error: err?.message || "Error attributing referral." };
  }
}

/**
 * Checks verification & job completion triggers to qualify referrals and disburse non-cash rewards
 */
export async function evaluateReferralQualification(params: {
  refereeUserId: string;
  eventType: "VERIFIED" | "JOB_COMPLETED";
  jobReference?: string;
}): Promise<{ qualified: boolean; recordId?: string; rewardsDisbursed: number }> {
  const { refereeUserId, eventType, jobReference } = params;

  try {
    const record = await prisma.referralRecord.findFirst({
      where: {
        refereeId: refereeUserId,
        status: { in: ["PENDING_VERIFICATION", "PENDING_FIRST_JOB"] },
      },
      include: {
        referrer: { include: { professional: true } },
        referee: { include: { professional: true } },
        referralCode: true,
      },
    });

    if (!record) {
      return { qualified: false, rewardsDisbursed: 0 };
    }

    const referee = record.referee;
    const isPro = referee.role === "PROFESSIONAL" || Boolean(referee.professional);
    const isRefereeVerified = Boolean(referee.isVerified || referee.professional?.verificationStatus === "VERIFIED");

    let isJobComplete = record.hasCompletedFirstJob;

    if (eventType === "JOB_COMPLETED") {
      isJobComplete = true;
    } else {
      const completedJobCount = isPro
        ? await prisma.booking.count({
            where: { professional: { userId: refereeUserId }, status: "COMPLETED" },
          })
        : await prisma.booking.count({
            where: { customerId: refereeUserId, status: "COMPLETED" },
          });
      if (completedJobCount > 0) isJobComplete = true;
    }

    // Update ongoing progress on record
    await prisma.referralRecord.update({
      where: { id: record.id },
      data: {
        isVerifiedReferee: isRefereeVerified,
        hasCompletedFirstJob: isJobComplete,
        firstJobReference: jobReference || record.firstJobReference,
        status: isRefereeVerified && isJobComplete ? "QUALIFIED" : isRefereeVerified ? "PENDING_FIRST_JOB" : "PENDING_VERIFICATION",
      },
    });

    // Check if fully qualified
    if (!isRefereeVerified || !isJobComplete || record.rewardsIssued) {
      return { qualified: false, recordId: record.id, rewardsDisbursed: 0 };
    }

    // --- QUALIFICATION MET: DISBURSE NON-CASH REWARDS ---
    const config = await getReferralRulesConfig();

    // 1. Calculate Referrer Tier & Multiplier
    const previousQualifiedCount = await prisma.referralRecord.count({
      where: { referrerId: record.referrerId, status: "QUALIFIED" },
    });
    const currentQualifiedCount = previousQualifiedCount + 1;

    const previousTier = calculateTier(previousQualifiedCount);
    const currentTier = calculateTier(currentQualifiedCount);
    const multiplier = currentTier.multiplier;

    let rewardsDisbursedCount = 0;
    const now = new Date();
    const expiry90Days = new Date(now.getTime() + 90 * 86400 * 1000);
    const expiry30Days = new Date(now.getTime() + 30 * 86400 * 1000);

    const programType = record.programType as ReferralProgramType;

    if (programType === "ARTISAN_TO_ARTISAN") {
      // Recruiter Reward: 0% platform commission pass + Tool Voucher
      const toolVoucherAmount = Math.round(config.artisanToArtisan.referrerToolVoucherNgn * multiplier);

      await prisma.referralReward.create({
        data: {
          referralRecordId: record.id,
          recipientId: record.referrerId,
          programType,
          benefitType: "COMMISSION_DISCOUNT_TOKEN",
          title: "0% Platform Commission Waiver Pass",
          description: `Enjoy 0% platform commission waiver on your next ${config.artisanToArtisan.referrerCommissionPassJobs} completed bookings.`,
          valueNgn: 0,
          discountPercent: 100,
          remainingUses: config.artisanToArtisan.referrerCommissionPassJobs,
          expiresAt: expiry90Days,
          referenceCode: `HHP-PASS-${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });

      await prisma.referralReward.create({
        data: {
          referralRecordId: record.id,
          recipientId: record.referrerId,
          programType,
          benefitType: "TOOL_MARKETPLACE_VOUCHER",
          title: `₦${toolVoucherAmount.toLocaleString()} Tool & Equipment Voucher`,
          description: `Redeemable towards genuine replacement parts and certified tools in the HandyHub Marketplace. (${currentTier.name} ${multiplier}x applied).`,
          valueNgn: toolVoucherAmount,
          remainingUses: 1,
          expiresAt: expiry90Days,
          referenceCode: `HHP-TOOL-${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });

      // Referee Reward: Welcome Tool Voucher + 50% commission discount
      await prisma.referralReward.create({
        data: {
          referralRecordId: record.id,
          recipientId: record.refereeId,
          programType,
          benefitType: "TOOL_MARKETPLACE_VOUCHER",
          title: `₦${config.artisanToArtisan.refereeToolVoucherNgn.toLocaleString()} Welcome Artisan Tool Voucher`,
          description: "Welcome to HandyHub Pro! Use this voucher to equip your toolkit on the Marketplace.",
          valueNgn: config.artisanToArtisan.refereeToolVoucherNgn,
          remainingUses: 1,
          expiresAt: expiry90Days,
          referenceCode: `HHP-WLC-${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });

      rewardsDisbursedCount += 3;
    } else if (programType === "CUSTOMER_TO_CUSTOMER") {
      // Recruiter Reward: Platform Service Credit + Free Express Dispatch Token
      const creditAmount = Math.round(config.customerToCustomer.referrerServiceCreditNgn * multiplier);

      // Deposit non-cash service credit directly into customer wallet
      await prisma.wallet.upsert({
        where: { userId: record.referrerId },
        update: { balance: { increment: creditAmount } },
        create: { userId: record.referrerId, balance: creditAmount },
      });

      const refWallet = await prisma.wallet.findUnique({ where: { userId: record.referrerId } });
      if (refWallet) {
        await prisma.walletTransaction.create({
          data: {
            walletId: refWallet.id,
            type: "CREDIT",
            amount: creditAmount,
            description: `Referral Service Credit Reward: ${referee.firstName} completed their first booking (${currentTier.name} ${multiplier}x).`,
            gateway: "WALLET",
          },
        });
      }

      await prisma.referralReward.create({
        data: {
          referralRecordId: record.id,
          recipientId: record.referrerId,
          programType,
          benefitType: "EXPRESS_DISPATCH_TOKEN",
          title: "Priority Express Dispatch Upgrade",
          description: "Waives the urgent dispatch surcharge on your next booking under 60 minutes.",
          valueNgn: 3500,
          remainingUses: config.customerToCustomer.referrerExpressTokens,
          expiresAt: expiry90Days,
          referenceCode: `HHP-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });

      // Referee Reward: ₦2,000 Welcome Voucher
      await prisma.referralReward.create({
        data: {
          referralRecordId: record.id,
          recipientId: record.refereeId,
          programType,
          benefitType: "SERVICE_CREDIT",
          title: `₦${config.customerToCustomer.refereeBookingDiscountNgn.toLocaleString()} Welcome Service Credit`,
          description: "Enjoy ₦2,000 off your home maintenance bookings.",
          valueNgn: config.customerToCustomer.refereeBookingDiscountNgn,
          remainingUses: 1,
          expiresAt: expiry30Days,
          referenceCode: `HHP-CRED-${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });

      rewardsDisbursedCount += 3;
    } else if (programType === "CUSTOMER_TO_ARTISAN") {
      // Customer recommends an artisan: ₦5,000 Service Credit + VIP Concierge
      const creditAmount = Math.round(config.customerToArtisan.referrerServiceCreditNgn * multiplier);

      await prisma.wallet.upsert({
        where: { userId: record.referrerId },
        update: { balance: { increment: creditAmount } },
        create: { userId: record.referrerId, balance: creditAmount },
      });

      const refWallet = await prisma.wallet.findUnique({ where: { userId: record.referrerId } });
      if (refWallet) {
        await prisma.walletTransaction.create({
          data: {
            walletId: refWallet.id,
            type: "CREDIT",
            amount: creditAmount,
            description: `Artisan Discovery Reward: ${referee.firstName} successfully vetted & completed their first job!`,
            gateway: "WALLET",
          },
        });
      }

      // Pro gets 0% platform fee on first 2 jobs
      await prisma.referralReward.create({
        data: {
          referralRecordId: record.id,
          recipientId: record.refereeId,
          programType,
          benefitType: "COMMISSION_DISCOUNT_TOKEN",
          title: "0% Welcome Commission Waiver Pass",
          description: "Enjoy 0% platform fee on your first 2 completed service bookings.",
          valueNgn: 0,
          discountPercent: 100,
          remainingUses: config.customerToArtisan.refereeCommissionPassJobs,
          expiresAt: expiry90Days,
          referenceCode: `HHP-PROPASS-${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });

      rewardsDisbursedCount += 2;
    }

    // Mark Record Qualified & rewards issued
    await prisma.referralRecord.update({
      where: { id: record.id },
      data: {
        status: "QUALIFIED",
        rewardsIssued: true,
        qualifiedAt: new Date(),
      },
    });

    await prisma.referralCode.update({
      where: { id: record.referralCodeId },
      data: { qualifiedCount: { increment: 1 } },
    });

    // Check Milestone Tier Upgrade
    if (currentTier.level !== previousTier.level) {
      await dispatchMilestoneNotification({
        userId: record.referrerId,
        newTier: currentTier.level,
        totalQualified: currentQualifiedCount,
        unlockedPerks: currentTier.perks,
      });
    }

    await prisma.referralAuditLog.create({
      data: {
        referralRecordId: record.id,
        actorId: refereeUserId,
        actorRole: "SYSTEM",
        action: "QUALIFIED",
        details: JSON.stringify({
          programType,
          rewardsDisbursedCount,
          currentTier: currentTier.level,
          multiplier,
        }),
      },
    });

    return { qualified: true, recordId: record.id, rewardsDisbursed: rewardsDisbursedCount };
  } catch (err: any) {
    console.error("[Evaluate Referral Qualification Error]:", err);
    return { qualified: false, rewardsDisbursed: 0 };
  }
}

/**
 * Aggregates complete referral metrics, recruiter tier, rewards vault, and active ledger for user
 */
export async function getUserReferralSummary(userId: string): Promise<ReferralUserSummary> {
  const { code, link, qrDataUrl } = await getOrCreateReferralCode(userId);

  const [referralsSent, rewardsVault, wallet] = await Promise.all([
    prisma.referralRecord.findMany({
      where: { referrerId: userId },
      include: {
        referee: { select: { firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.referralReward.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    }),
  ]);

  const totalReferralsSent = referralsSent.length;
  const qualifiedRecords = referralsSent.filter((r) => r.status === "QUALIFIED");
  const totalQualifiedReferrals = qualifiedRecords.length;
  const pendingReferralsCount = referralsSent.filter((r) => r.status !== "QUALIFIED" && r.status !== "FLAGGED_FRAUD" && r.status !== "REJECTED").length;

  const currentTier = calculateTier(totalQualifiedReferrals);
  const nextTier = getNextTier(currentTier.level);

  let progressToNextTierPercent = 100;
  if (nextTier) {
    const prevMin = currentTier.minReferrals;
    const nextMin = nextTier.minReferrals;
    const progress = (totalQualifiedReferrals - prevMin) / (nextMin - prevMin);
    progressToNextTierPercent = Math.min(100, Math.max(0, Math.round(progress * 100)));
  }

  // Calculate active rewards
  const activeCommissionPasses = rewardsVault
    .filter((r) => r.benefitType === "COMMISSION_DISCOUNT_TOKEN" && !r.isRedeemed && r.remainingUses > 0 && new Date(r.expiresAt) > new Date())
    .reduce((sum, r) => sum + r.remainingUses, 0);

  const activeMarketplaceVouchers = rewardsVault
    .filter((r) => r.benefitType === "TOOL_MARKETPLACE_VOUCHER" && !r.isRedeemed && r.remainingUses > 0 && new Date(r.expiresAt) > new Date());

  const activeInsuranceTokens = rewardsVault
    .filter((r) => r.benefitType === "INSURANCE_BOOST_TOKEN" && !r.isRedeemed && r.remainingUses > 0);

  const activeExpressTokens = rewardsVault
    .filter((r) => r.benefitType === "EXPRESS_DISPATCH_TOKEN" && !r.isRedeemed && r.remainingUses > 0);

  const totalEstimatedNonCashEarnedNgn = rewardsVault.reduce((sum, r) => sum + (r.valueNgn || 0), 0);

  const recentActivity: ReferralRecordItem[] = referralsSent.map((r) => ({
    id: r.id,
    referrerId: r.referrerId,
    referrerName: "You",
    referrerRole: "RECRUITER",
    refereeId: r.refereeId,
    refereeName: `${r.referee.firstName} ${r.referee.lastName}`,
    refereeEmail: r.referee.email,
    refereeRole: r.referee.role,
    programType: r.programType as ReferralProgramType,
    status: r.status as any,
    isVerifiedReferee: r.isVerifiedReferee,
    hasCompletedFirstJob: r.hasCompletedFirstJob,
    firstJobReference: r.firstJobReference,
    rewardsIssued: r.rewardsIssued,
    fraudScore: r.fraudScore,
    fraudFlags: (() => {
      try {
        return JSON.parse(r.fraudFlags || "[]");
      } catch {
        return [];
      }
    })(),
    createdAt: r.createdAt.toISOString(),
    qualifiedAt: r.qualifiedAt ? r.qualifiedAt.toISOString() : null,
  }));

  const formattedRewards: NonCashReward[] = rewardsVault.map((r) => ({
    id: r.id,
    recipientId: r.recipientId,
    programType: r.programType as ReferralProgramType,
    benefitType: r.benefitType as any,
    title: r.title,
    description: r.description,
    valueNgn: r.valueNgn,
    discountPercent: r.discountPercent ?? 0,
    remainingUses: r.remainingUses,
    expiresAt: r.expiresAt.toISOString(),
    isRedeemed: r.isRedeemed,
    referenceCode: r.referenceCode,
    metadata: (() => {
      try {
        return JSON.parse(r.metadata || "{}");
      } catch {
        return {};
      }
    })(),
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    referralCode: code,
    referralLink: link,
    qrDataUrl,
    currentTier,
    nextTier,
    progressToNextTierPercent,
    totalReferralsSent,
    totalQualifiedReferrals,
    pendingReferralsCount,
    totalEstimatedNonCashEarnedNgn,
    activeBenefits: {
      serviceCreditBalanceNgn: wallet?.balance || 0,
      activeCommissionPasses,
      activeMarketplaceVouchersCount: activeMarketplaceVouchers.length,
      activeInsuranceTokensCount: activeInsuranceTokens.length,
      activeExpressTokensCount: activeExpressTokens.length,
    },
    rewardsVault: formattedRewards,
    recentActivity,
  };
}
