import { NextResponse } from "next/server";
import { partnerStore } from "@/lib/partners/store";
import { PartnerPayoutTransaction } from "@/lib/partners/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partnerId, amount, bankName, accountNumber, accountName } = body;

    if (!partnerId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Partner ID and valid withdrawal amount are required." }, { status: 400 });
    }

    const partner = await partnerStore.findPartner(partnerId);
    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found." }, { status: 404 });
    }

    const config = await partnerStore.getConfig();
    const minPayout = config.payoutRules.minimumPayoutNgn || 10000;

    if (amount < minPayout) {
      return NextResponse.json(
        { error: `Minimum payout threshold is ₦${minPayout.toLocaleString()}. You requested ₦${Number(amount).toLocaleString()}.` },
        { status: 400 }
      );
    }

    if (partner.walletBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient commission balance. Available: ₦${partner.walletBalance.toLocaleString()}, Requested: ₦${Number(amount).toLocaleString()}.` },
        { status: 400 }
      );
    }

    const resolvedBank = bankName || partner.bankName;
    const resolvedAccount = accountNumber || partner.bankAccount;
    const resolvedName = accountName || partner.accountName || partner.name;

    if (!resolvedBank || !resolvedAccount) {
      return NextResponse.json(
        { error: "Bank account details are missing. Please provide your bank name and account number." },
        { status: 400 }
      );
    }

    const payout: PartnerPayoutTransaction = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partnerId: partner.id,
      partnerName: partner.companyName || partner.name,
      amount: Number(amount),
      bankName: resolvedBank,
      accountNumber: resolvedAccount,
      accountName: resolvedName,
      status: "PENDING",
      reference: `HHP-PO-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: "Monthly Commission Settlement Batch",
      requestedAt: new Date().toISOString(),
    };

    await partnerStore.savePayout(payout);

    // Deduct wallet balance
    const updatedPartner = {
      ...partner,
      walletBalance: partner.walletBalance - Number(amount),
      totalWithdrawn: partner.totalWithdrawn + Number(amount),
      bankName: resolvedBank,
      bankAccount: resolvedAccount,
      accountName: resolvedName,
      updatedAt: new Date().toISOString(),
    };
    await partnerStore.savePartner(updatedPartner);

    return NextResponse.json({
      success: true,
      message: `Withdrawal request for ₦${Number(amount).toLocaleString()} submitted successfully (Ref: ${payout.reference}). Settlements are processed to ${resolvedBank} (${resolvedAccount}).`,
      payout,
      remainingBalance: updatedPartner.walletBalance,
    });
  } catch (error: any) {
    console.error("[Partner Withdraw API Error]:", error);
    return NextResponse.json({ error: "Failed to process withdrawal request" }, { status: 500 });
  }
}
