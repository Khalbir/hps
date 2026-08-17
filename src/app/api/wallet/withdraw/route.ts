import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateFraudRiskScore } from "@/lib/security";
import { getCommissionRules } from "@/lib/escrow";
import { formatNaira, sendMultiChannelNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, amount, bankCode, bankName, accountNumber, accountName } = body;

    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0 || !accountNumber || !bankName) {
      return NextResponse.json(
        { error: "Valid withdrawal amount, bank name, and account number are required." },
        { status: 400 }
      );
    }

    // Resolve User in Database
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId }, include: { wallet: true } });
    }
    if (!user && email) {
      user = await prisma.user.findFirst({
        where: { email: { equals: email.trim(), mode: "insensitive" } },
        include: { wallet: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    // Resolve Wallet
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id, balance: 0, pendingEscrow: 0, currency: "NGN" },
      });
    }

    const rules = await getCommissionRules();

    if (withdrawAmount < rules.minWithdrawalNgn) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ${formatNaira(rules.minWithdrawalNgn)}.` },
        { status: 400 }
      );
    }

    if (withdrawAmount > wallet.balance) {
      return NextResponse.json(
        {
          error: `Insufficient available wallet balance. You requested ${formatNaira(withdrawAmount)}, but your available balance is ${formatNaira(wallet.balance)}.`,
        },
        { status: 400 }
      );
    }

    // Fraud Evaluation Check
    const fraudCheck = evaluateFraudRiskScore({
      rapidWithdrawalAttempts: 1,
      isAccountVerified: user.isVerified,
    });

    if (fraudCheck.blockAction) {
      return NextResponse.json(
        {
          error: "Withdrawal blocked due to security protection triggers.",
          reasons: fraudCheck.reasons,
        },
        { status: 403 }
      );
    }

    const reference = `WTH_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Atomic Database Transaction: Deduct Balance & Create Records
    const [updatedWallet, withdrawalRecord, transactionRecord] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: withdrawAmount } },
      }),
      prisma.withdrawalRequest.create({
        data: {
          walletId: wallet.id,
          amount: withdrawAmount,
          bankCode: bankCode || "058",
          bankName,
          accountNumber,
          accountName: accountName || `${user.firstName} ${user.lastName}`,
          status: "PROCESSING",
          reference,
        },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: withdrawAmount,
          description: `Bank Withdrawal to ${bankName} (${accountNumber})`,
          reference,
          gateway: "NUBAN_TRANSFER",
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "WITHDRAWAL_REQUESTED",
          entity: "Wallet",
          entityId: wallet.id,
          details: JSON.stringify({
            amount: withdrawAmount,
            bankName,
            accountNumber,
            reference,
            remainingBalance: wallet.balance - withdrawAmount,
          }),
        },
      }),
    ]);

    // Dispatch Payout Notification
    await sendMultiChannelNotification({
      userId: user.id,
      recipientEmail: user.email,
      recipientPhone: user.phone || undefined,
      recipientName: `${user.firstName} ${user.lastName}`,
      type: "PAYMENT",
      title: "Withdrawal Request Processing",
      message: `Your withdrawal of ${formatNaira(withdrawAmount)} to ${bankName} (${accountNumber}) has been submitted and is processing via Paystack Transfer API. Ref: ${reference}`,
      metadata: {
        "Reference": reference,
        "Amount": formatNaira(withdrawAmount),
        "Destination": `${bankName} - ${accountNumber}`,
        "Status": "PROCESSING",
      },
    }).catch((e) => console.warn("[Withdrawal Notification Warning]:", e));

    return NextResponse.json({
      success: true,
      reference,
      amount: withdrawAmount,
      bankName,
      accountNumber,
      accountName: accountName || `${user.firstName} ${user.lastName}`,
      status: "PROCESSING",
      newBalance: updatedWallet.balance,
      estimatedDelivery: "Instant NUBAN Transfer (1-3 minutes)",
      message: `Withdrawal of ${formatNaira(withdrawAmount)} submitted successfully! Funds are on the way to your bank account.`,
      transaction: transactionRecord,
    });
  } catch (error: any) {
    console.error("[Withdraw REST API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error processing withdrawal" },
      { status: 500 }
    );
  }
}

