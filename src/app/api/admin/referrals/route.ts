import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getReferralRulesConfig,
  saveReferralRulesConfig,
  calculateTier,
  RECRUITER_TIERS,
} from "@/lib/referrals/config";
import { generateCampaignRecommendations } from "@/lib/referrals/ai-agent";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalCodesCount,
      allCodes,
      allRecords,
      allRewards,
      fraudFlaggedRecords,
      recentAuditLogs,
      rulesConfig,
      campaignRecommendations,
    ] = await Promise.all([
      prisma.referralCode.count(),
      prisma.referralCode.findMany({ select: { clickCount: true, signupCount: true, qualifiedCount: true } }),
      prisma.referralRecord.findMany({
        include: {
          referrer: { select: { firstName: true, lastName: true, email: true, role: true } },
          referee: { select: { firstName: true, lastName: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.referralReward.findMany({ select: { valueNgn: true, isRedeemed: true, benefitType: true } }),
      prisma.referralRecord.findMany({
        where: {
          OR: [{ fraudScore: { gte: 20 } }, { status: "FLAGGED_FRAUD" }],
        },
        include: {
          referrer: { select: { firstName: true, lastName: true, email: true, phone: true } },
          referee: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
        orderBy: { fraudScore: "desc" },
        take: 30,
      }),
      prisma.referralAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      getReferralRulesConfig(),
      generateCampaignRecommendations(),
    ]);

    // Aggregate KPIs
    const totalClicks = allCodes.reduce((sum, c) => sum + c.clickCount, 0);
    const totalSignups = allCodes.reduce((sum, c) => sum + c.signupCount, 0);
    const totalQualified = allCodes.reduce((sum, c) => sum + c.qualifiedCount, 0);
    const conversionRate = totalClicks > 0 ? ((totalQualified / totalClicks) * 100).toFixed(1) : "0.0";

    const totalNonCashDisbursedNgn = allRewards.reduce((sum, r) => sum + (r.valueNgn || 0), 0);
    const totalRedeemedRewards = allRewards.filter((r) => r.isRedeemed).length;

    // Recruiter Tier Breakdown
    const referrersGroup = await prisma.referralRecord.groupBy({
      by: ["referrerId"],
      where: { status: "QUALIFIED" },
      _count: { id: true },
    });

    const tierBreakdown = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
      AMBASSADOR: 0,
    };

    referrersGroup.forEach((g) => {
      const tier = calculateTier(g._count.id);
      tierBreakdown[tier.level]++;
    });

    const formattedRecords = allRecords.map((r) => ({
      id: r.id,
      referrerName: `${r.referrer.firstName} ${r.referrer.lastName}`,
      referrerEmail: r.referrer.email,
      referrerRole: r.referrer.role,
      refereeName: `${r.referee.firstName} ${r.referee.lastName}`,
      refereeEmail: r.referee.email,
      refereeRole: r.referee.role,
      programType: r.programType,
      status: r.status,
      isVerifiedReferee: r.isVerifiedReferee,
      hasCompletedFirstJob: r.hasCompletedFirstJob,
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

    const formattedFraudQueue = fraudFlaggedRecords.map((r) => ({
      id: r.id,
      referrerName: `${r.referrer.firstName} ${r.referrer.lastName}`,
      referrerEmail: r.referrer.email,
      referrerPhone: r.referrer.phone || "N/A",
      refereeName: `${r.referee.firstName} ${r.referee.lastName}`,
      refereeEmail: r.referee.email,
      refereePhone: r.referee.phone || "N/A",
      programType: r.programType,
      fraudScore: r.fraudScore,
      fraudFlags: (() => {
        try {
          return JSON.parse(r.fraudFlags || "[]");
        } catch {
          return [];
        }
      })(),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      telemetry: {
        totalCodesCount,
        totalClicks,
        totalSignups,
        totalQualified,
        conversionRate: `${conversionRate}%`,
        totalNonCashDisbursedNgn,
        totalRewardsCount: allRewards.length,
        totalRedeemedRewards,
        tierBreakdown,
      },
      rulesConfig,
      campaignRecommendations,
      fraudQueue: formattedFraudQueue,
      recentRecords: formattedRecords,
      auditLogs: recentAuditLogs.map((l) => ({
        id: l.id,
        action: l.action,
        actorRole: l.actorRole,
        actorId: l.actorId,
        details: (() => {
          try {
            return JSON.parse(l.details || "{}");
          } catch {
            return {};
          }
        })(),
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("[API Admin Referrals GET Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load admin referral intelligence." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, rules, recordId, overrideDecision, notes, adminId } = body;

    // 1. Save Config Rules
    if (action === "SAVE_RULES") {
      if (!rules) {
        return NextResponse.json({ error: "Rules payload required" }, { status: 400 });
      }
      const saved = await saveReferralRulesConfig(rules);
      if (!saved) {
        return NextResponse.json({ error: "Failed to save referral rules to database" }, { status: 500 });
      }

      await prisma.auditLog.create({
        data: {
          userId: adminId || "super_admin",
          action: "REFERRAL_RULES_UPDATED",
          entity: "SYSTEM_SETTING",
          details: JSON.stringify(rules),
        },
      });

      return NextResponse.json({ success: true, message: "Referral rules and reward values updated successfully." });
    }

    // 2. Fraud Review Override
    if (action === "FRAUD_OVERRIDE") {
      if (!recordId || !overrideDecision) {
        return NextResponse.json({ error: "recordId and overrideDecision required" }, { status: 400 });
      }

      const record = await prisma.referralRecord.findUnique({
        where: { id: recordId },
      });

      if (!record) {
        return NextResponse.json({ error: "Referral record not found" }, { status: 404 });
      }

      const newStatus = overrideDecision === "APPROVE" ? "PENDING_FIRST_JOB" : "REJECTED";

      await prisma.referralRecord.update({
        where: { id: recordId },
        data: {
          status: newStatus,
          fraudScore: overrideDecision === "APPROVE" ? 0 : record.fraudScore,
        },
      });

      await prisma.referralAuditLog.create({
        data: {
          referralRecordId: recordId,
          actorId: adminId || "admin",
          actorRole: "ADMIN",
          action: "FRAUD_OVERRIDDEN",
          details: JSON.stringify({
            overrideDecision,
            notes: notes || "Manual Executive Review override",
            previousStatus: record.status,
            newStatus,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Referral record ${recordId} has been updated to ${newStatus}.`,
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("[API Admin Referrals POST Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process referral admin request." },
      { status: 500 }
    );
  }
}
