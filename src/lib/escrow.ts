/**
 * Production-Grade Commission & Escrow Engine for HandyHub Pro Solutions
 * Secure server-side fee calculations, dynamic admin rules, escrow vault management,
 * and immutable wallet ledger transitions.
 */

import { prisma } from "@/lib/db";
import { formatNaira, sendMultiChannelNotification } from "@/lib/notifications";
import {
  CommissionRulesConfig,
  DEFAULT_COMMISSION_RULES,
  CommissionBreakdown,
} from "./escrow-types";

export * from "./escrow-types";

// In-memory cache for ultra-fast calculation
let cachedCommissionRules: CommissionRulesConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Retrieve Active Commission & Escrow Rules
 * Reads from database Setting table with fallback to DEFAULT_COMMISSION_RULES.
 */
export async function getCommissionRules(): Promise<CommissionRulesConfig> {
  const now = Date.now();
  if (cachedCommissionRules && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCommissionRules;
  }

  let resolvedRules: CommissionRulesConfig = DEFAULT_COMMISSION_RULES;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "COMMISSION_RULES_CONFIG" },
    });

    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      resolvedRules = {
        ...DEFAULT_COMMISSION_RULES,
        ...parsed,
        categoryRates: {
          ...DEFAULT_COMMISSION_RULES.categoryRates,
          ...(parsed.categoryRates || {}),
        },
      };
    }
  } catch (err) {
    console.warn("[Escrow Engine] Database setting lookup warning, using defaults:", err);
  }

  cachedCommissionRules = resolvedRules;
  cacheTimestamp = now;
  return resolvedRules;
}

/**
 * Persist Updated Commission & Escrow Rules from Admin Dashboard
 */
export async function saveCommissionRules(newRules: Partial<CommissionRulesConfig>): Promise<CommissionRulesConfig> {
  const current = await getCommissionRules();
  const merged: CommissionRulesConfig = {
    ...current,
    ...newRules,
    categoryRates: {
      ...current.categoryRates,
      ...(newRules.categoryRates || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    await prisma.setting.upsert({
      where: { key: "COMMISSION_RULES_CONFIG" },
      create: {
        key: "COMMISSION_RULES_CONFIG",
        value: JSON.stringify(merged),
      },
      update: {
        value: JSON.stringify(merged),
      },
    });

    cachedCommissionRules = merged;
    cacheTimestamp = Date.now();
  } catch (err) {
    console.error("[Escrow Engine] Failed to save commission rules to database:", err);
    throw new Error("Failed to persist commission rules to database.");
  }

  return merged;
}

/**
 * Calculate Precise Commission Breakdown for a Given Amount & Service Category
 */
export async function calculateCommissionBreakdown(
  totalAmountNgn: number,
  categorySlug?: string
): Promise<CommissionBreakdown> {
  const rules = await getCommissionRules();
  const slug = (categorySlug || "general").toLowerCase().trim();

  const commissionRatePercent = rules.categoryRates[slug] ?? rules.defaultRatePercent;
  const commissionAmountNgn = Math.round(totalAmountNgn * (commissionRatePercent / 100));
  const proNetEarningsNgn = Math.max(0, totalAmountNgn - commissionAmountNgn);

  return {
    totalAmountNgn,
    categorySlug: slug,
    commissionRatePercent,
    commissionAmountNgn,
    proNetEarningsNgn,
    escrowHoldHours: rules.escrowHoldHours,
  };
}

/**
 * Hold Verified Payment in Escrow
 * Called upon successful payment confirmation from Paystack / Gateway.
 */
export async function holdPaymentInEscrow({
  bookingId,
  paymentReference,
  amountNgn,
}: {
  bookingId: string;
  paymentReference: string;
  amountNgn: number;
}) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        professional: { include: { user: true } },
        service: { include: { category: true } },
      },
    });

    if (!booking) {
      console.warn(`[Escrow Hold] Booking #${bookingId} not found.`);
      return null;
    }

    const categorySlug = booking.service?.category?.slug || booking.service?.slug || "general";
    const breakdown = await calculateCommissionBreakdown(amountNgn, categorySlug);

    // If professional is assigned, increment their wallet's pendingEscrow
    if (booking.professional?.user?.id) {
      const proUserId = booking.professional.user.id;

      let proWallet = await prisma.wallet.findUnique({
        where: { userId: proUserId },
      });

      if (!proWallet) {
        proWallet = await prisma.wallet.create({
          data: {
            userId: proUserId,
            balance: 0,
            pendingEscrow: 0,
            currency: "NGN",
          },
        });
      }

      // Check if this booking has already had an escrow hold to ensure idempotency
      const existingHoldTx = await prisma.walletTransaction.findFirst({
        where: {
          walletId: proWallet.id,
          reference: `ESC_HOLD_${booking.reference}`,
        },
      });

      if (!existingHoldTx) {
        await prisma.wallet.update({
          where: { id: proWallet.id },
          data: {
            pendingEscrow: { increment: breakdown.proNetEarningsNgn },
          },
        });

        await prisma.walletTransaction.create({
          data: {
            walletId: proWallet.id,
            type: "ESCROW_HOLD",
            amount: breakdown.proNetEarningsNgn,
            description: `Escrow Hold: Booking #${booking.reference} via ${paymentReference} (${booking.service?.name || "Service"})`,
            reference: `ESC_HOLD_${booking.reference}`,
            gateway: "WALLET",
          },
        });
      }

      // Notify Professional of Protected Job Assignment
      await sendMultiChannelNotification({
        userId: proUserId,
        recipientEmail: booking.professional.user.email,
        recipientPhone: booking.professional.user.phone || undefined,
        recipientName: `${booking.professional.user.firstName} ${booking.professional.user.lastName}`,
        type: "PAYMENT",
        title: "Escrow Deposit Secured for Assigned Job",
        message: `Customer payment of ${formatNaira(amountNgn)} for Booking #${booking.reference} is secured in HandyHub Escrow. Your net payout of ${formatNaira(breakdown.proNetEarningsNgn)} (after ${breakdown.commissionRatePercent}% platform fee) will disburse upon job completion.`,
        metadata: {
          "Booking Ref": booking.reference,
          "Total Price": formatNaira(amountNgn),
          "Platform Fee": `${breakdown.commissionRatePercent}% (${formatNaira(breakdown.commissionAmountNgn)})`,
          "Net Payout": formatNaira(breakdown.proNetEarningsNgn),
          "Status": "HELD_IN_ESCROW",
        },
      }).catch((e) => console.warn("[Escrow Hold Notification Warning]:", e));
    }

    return breakdown;
  } catch (err) {
    console.error("[Escrow Engine] Error holding payment in escrow:", err);
    return null;
  }
}

/**
 * Release Escrow Payout to Professional's Available Wallet Balance
 * Fully idempotent: prevents double releases and records immutable financial logs.
 */
export async function releaseEscrowPayout({
  bookingId,
  triggerSource = "JOB_COMPLETION",
  notes,
}: {
  bookingId: string;
  triggerSource?: "JOB_COMPLETION" | "CUSTOMER_CONFIRMATION" | "ADMIN_RELEASE" | "AUTO_RELEASE";
  notes?: string;
}) {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: bookingId }, { reference: bookingId }],
      },
      include: {
        customer: true,
        professional: { include: { user: true } },
        service: { include: { category: true } },
      },
    });

    if (!booking) {
      throw new Error(`Booking #${bookingId} not found`);
    }

    if (!booking.professional?.user?.id) {
      throw new Error(`No verified professional is assigned to booking #${booking.reference}`);
    }

    const proUserId = booking.professional.user.id;
    const grossAmount = booking.finalPrice || booking.estimatedPrice || 0;
    const categorySlug = booking.service?.category?.slug || booking.service?.slug || "general";
    const breakdown = await calculateCommissionBreakdown(grossAmount, categorySlug);

    let proWallet = await prisma.wallet.findUnique({
      where: { userId: proUserId },
    });

    if (!proWallet) {
      proWallet = await prisma.wallet.create({
        data: {
          userId: proUserId,
          balance: 0,
          pendingEscrow: 0,
          currency: "NGN",
        },
      });
    }

    // Idempotency Guard: check if release transaction already exists
    const releaseRef = `ESC_REL_${booking.reference}`;
    const existingRelease = await prisma.walletTransaction.findFirst({
      where: {
        walletId: proWallet.id,
        reference: releaseRef,
      },
    });

    if (existingRelease) {
      return {
        success: true,
        alreadyReleased: true,
        message: `Escrow payout for booking #${booking.reference} was already released.`,
        netEarnings: breakdown.proNetEarningsNgn,
        commission: breakdown.commissionAmountNgn,
      };
    }

    // Atomic Balance Transfer: Deduct pendingEscrow, credit availableBalance
    const decrementEscrow = Math.min(proWallet.pendingEscrow, breakdown.proNetEarningsNgn);
    
    await prisma.$transaction(async (tx: any) => {
      await tx.wallet.update({
        where: { id: proWallet.id },
        data: {
          pendingEscrow: { decrement: decrementEscrow },
          balance: { increment: breakdown.proNetEarningsNgn },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: proWallet.id,
          type: "ESCROW_RELEASE",
          amount: breakdown.proNetEarningsNgn,
          description: `Escrow Payout Released: Booking #${booking.reference} (${booking.service?.name || "Service"})`,
          reference: releaseRef,
          gateway: "WALLET",
        },
      });
      await tx.auditLog.create({
        data: {
          userId: proUserId,
          action: "ESCROW_PAYOUT_RELEASED",
          entity: "Booking",
          entityId: booking.id,
          details: JSON.stringify({
            bookingRef: booking.reference,
            triggerSource,
            grossAmount,
            commissionRate: `${breakdown.commissionRatePercent}%`,
            platformCommission: breakdown.commissionAmountNgn,
            netEarnings: breakdown.proNetEarningsNgn,
            notes: notes || "Escrow disbursed successfully",
          }),
        },
      });
    });

    // Dispatch Payout Confirmation Notification to Professional
    await sendMultiChannelNotification({
      userId: proUserId,
      recipientEmail: booking.professional.user.email,
      recipientPhone: booking.professional.user.phone || undefined,
      recipientName: `${booking.professional.user.firstName} ${booking.professional.user.lastName}`,
      type: "PAYMENT",
      title: "Escrow Released: Net Earnings Credited! 💰",
      message: `Congratulations! Your net earnings of ${formatNaira(breakdown.proNetEarningsNgn)} for Booking #${booking.reference} have been deposited into your available wallet balance. You can withdraw to your bank anytime.`,
      metadata: {
        "Booking Ref": booking.reference,
        "Job": booking.service?.name,
        "Gross Price": formatNaira(grossAmount),
        "Commission Deducted": formatNaira(breakdown.commissionAmountNgn),
        "Net Credited": formatNaira(breakdown.proNetEarningsNgn),
        "Status": "AVAILABLE_FOR_WITHDRAWAL",
      },
    }).catch((e) => console.warn("[Escrow Release Notification Warning]:", e));

    return {
      success: true,
      alreadyReleased: false,
      message: `Successfully released ${formatNaira(breakdown.proNetEarningsNgn)} to ${booking.professional.user.firstName}'s wallet.`,
      netEarnings: breakdown.proNetEarningsNgn,
      commission: breakdown.commissionAmountNgn,
    };
  } catch (err: any) {
    console.error("[Escrow Engine] Failed to release escrow payout:", err);
    throw err;
  }
}

/**
 * Refund Escrow Payment to Customer's Wallet
 */
export async function refundEscrowPayment({
  bookingId,
  refundAmountNgn,
  reason,
  adminUserId,
}: {
  bookingId: string;
  refundAmountNgn?: number;
  reason: string;
  adminUserId: string;
}) {
  const booking = await prisma.booking.findFirst({
    where: { OR: [{ id: bookingId }, { reference: bookingId }] },
    include: {
      customer: true,
      professional: { include: { user: true } },
      service: true,
    },
  });

  if (!booking) {
    throw new Error(`Booking #${bookingId} not found`);
  }

  const refundTotal = refundAmountNgn || booking.finalPrice || booking.estimatedPrice || 0;

  // 1. Credit Customer Wallet
  let customerWallet = await prisma.wallet.findUnique({
    where: { userId: booking.customerId },
  });

  if (!customerWallet) {
    customerWallet = await prisma.wallet.create({
      data: {
        userId: booking.customerId,
        balance: 0,
        pendingEscrow: 0,
        currency: "NGN",
      },
    });
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.wallet.update({
      where: { id: customerWallet.id },
      data: { balance: { increment: refundTotal } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: customerWallet.id,
        type: "REFUND",
        amount: refundTotal,
        description: `Escrow Refund for Booking #${booking.reference}: ${reason}`,
        reference: `REF_${booking.reference}_${Date.now()}`,
        gateway: booking.paymentMethod || "WALLET",
      },
    });
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
        refundedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: "ESCROW_REFUND_PROCESSED",
        entity: "Booking",
        entityId: booking.id,
        details: JSON.stringify({
          bookingRef: booking.reference,
          refundTotal,
          reason,
          customerEmail: booking.customer.email,
        }),
      },
    });
    if (booking.professional?.userId) {
      const proWallet = await tx.wallet.findUnique({ where: { userId: booking.professional.userId } });
      if (proWallet && proWallet.pendingEscrow > 0) {
        const proDeduction = Math.min(proWallet.pendingEscrow, refundTotal);
        await tx.wallet.update({
          where: { id: proWallet.id },
          data: { pendingEscrow: { decrement: proDeduction } },
        });
      }
    }
  });

  // Notify Customer of Refund
  await sendMultiChannelNotification({
    userId: booking.customerId,
    recipientEmail: booking.customer.email,
    recipientPhone: booking.customer.phone || undefined,
    recipientName: `${booking.customer.firstName} ${booking.customer.lastName}`,
    type: "PAYMENT",
    title: "Escrow Refund Credited to Wallet",
    message: `A refund of ${formatNaira(refundTotal)} for Booking #${booking.reference} has been deposited into your HandyHub Wallet balance. Reason: ${reason}`,
    metadata: {
      "Booking Ref": booking.reference,
      "Refund Amount": formatNaira(refundTotal),
      "Status": "REFUNDED_TO_WALLET",
    },
  }).catch((e) => console.warn("[Escrow Refund Notification Warning]:", e));

  return {
    success: true,
    refundAmount: refundTotal,
    bookingRef: booking.reference,
  };
}
