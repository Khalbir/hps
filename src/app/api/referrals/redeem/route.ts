import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { rewardId, referenceCode, userId } = await request.json();

    if (!rewardId && !referenceCode) {
      return NextResponse.json({ error: "Reward ID or reference code required" }, { status: 400 });
    }

    const reward = await prisma.referralReward.findFirst({
      where: rewardId ? { id: rewardId } : { referenceCode: referenceCode.trim().toUpperCase() },
      include: { recipient: true },
    });

    if (!reward) {
      return NextResponse.json({ error: "Reward not found." }, { status: 404 });
    }

    if (reward.isRedeemed || reward.remainingUses <= 0) {
      return NextResponse.json({ error: "This reward token has already been fully redeemed." }, { status: 400 });
    }

    if (new Date(reward.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This reward voucher has expired." }, { status: 400 });
    }

    // Decrement remaining uses or mark redeemed
    const updatedUses = reward.remainingUses - 1;
    const isNowRedeemed = updatedUses <= 0;

    const updated = await prisma.referralReward.update({
      where: { id: reward.id },
      data: {
        remainingUses: updatedUses,
        isRedeemed: isNowRedeemed,
      },
    });

    await prisma.referralAuditLog.create({
      data: {
        referralRecordId: reward.referralRecordId,
        actorId: userId || reward.recipientId,
        actorRole: "USER",
        action: "REWARD_DISBURSED",
        details: JSON.stringify({
          rewardId: reward.id,
          referenceCode: reward.referenceCode,
          benefitType: reward.benefitType,
          valueNgn: reward.valueNgn,
          remainingUses: updatedUses,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ${reward.title}!`,
      reward: {
        id: updated.id,
        benefitType: updated.benefitType,
        remainingUses: updated.remainingUses,
        isRedeemed: updated.isRedeemed,
      },
    });
  } catch (error: any) {
    console.error("[API Referrals Redeem Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to redeem reward." },
      { status: 500 }
    );
  }
}
