import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCommissionRules, saveCommissionRules } from "@/lib/escrow";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rules = await getCommissionRules();

    // Aggregate real-time Escrow & Platform Financial Metrics from Database
    let totalEscrowHeld = 0;
    let totalEscrowReleased = 0;
    let totalPlatformCommissionEarned = 0;
    let pendingWithdrawalCount = 0;
    let pendingWithdrawalTotal = 0;

    try {
      // 1. Pending Escrow in All Wallets
      const wallets = await prisma.wallet.findMany({
        select: { pendingEscrow: true },
      });
      totalEscrowHeld = wallets.reduce((acc, w) => acc + (w.pendingEscrow || 0), 0);

      // 2. Escrow Released Transactions
      const releaseTxs = await prisma.walletTransaction.findMany({
        where: { type: "ESCROW_RELEASE" },
        select: { amount: true },
      });
      totalEscrowReleased = releaseTxs.reduce((acc, tx) => acc + tx.amount, 0);

      // 3. Platform Commission from Paid Bookings
      const completedBookings = await prisma.booking.findMany({
        where: { status: "COMPLETED", paymentStatus: { in: ["PAID", "SUCCESS"] } },
        select: { finalPrice: true, estimatedPrice: true },
      });
      const grossCompletedTotal = completedBookings.reduce(
        (acc, b) => acc + (b.finalPrice || b.estimatedPrice || 0),
        0
      );
      totalPlatformCommissionEarned = Math.round(grossCompletedTotal * (rules.defaultRatePercent / 100));

      // 4. Pending Withdrawals
      const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
        where: { status: "PENDING" },
        select: { amount: true },
      });
      pendingWithdrawalCount = pendingWithdrawals.length;
      pendingWithdrawalTotal = pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0);
    } catch (metricErr) {
      console.warn("[Commission Rules Telemetry Warning]:", metricErr);
    }

    return NextResponse.json({
      success: true,
      rules,
      metrics: {
        totalEscrowHeld,
        totalEscrowReleased,
        totalPlatformCommissionEarned,
        pendingWithdrawalCount,
        pendingWithdrawalTotal,
      },
    });
  } catch (error: any) {
    console.error("[Commission Rules GET API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch commission rules: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rules } = body;

    if (!rules || typeof rules !== "object") {
      return NextResponse.json(
        { error: "Valid rules configuration object is required" },
        { status: 400 }
      );
    }

    // Validation: defaultRatePercent between 0% and 50%
    if (rules.defaultRatePercent !== undefined) {
      const rate = Number(rules.defaultRatePercent);
      if (isNaN(rate) || rate < 0 || rate > 50) {
        return NextResponse.json(
          { error: "Default commission rate must be a valid number between 0% and 50%" },
          { status: 400 }
        );
      }
    }

    const updatedRules = await saveCommissionRules(rules);

    return NextResponse.json({
      success: true,
      message: "Commission & Escrow policy rules updated successfully across HandyHub platform!",
      rules: updatedRules,
    });
  } catch (error: any) {
    console.error("[Commission Rules POST API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update commission rules" },
      { status: 500 }
    );
  }
}
