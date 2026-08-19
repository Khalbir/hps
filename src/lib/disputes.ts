import { prisma } from "./prisma";
import crypto from "crypto";

export interface CreateDisputeOptions {
  orderId: string;
  orderItemId?: string;
  customerId: string;
  reason:
    | "ITEM_NOT_AS_DESCRIBED"
    | "DAMAGED_IN_TRANSIT"
    | "WRONG_PART_DELIVERED"
    | "MERCHANT_UNRESPONSIVE"
    | "MISSING_COMPONENTS"
    | "OTHER";
  description: string;
  evidencePhotos?: string[];
  claimAmount?: number;
}

export interface ResolveDisputeOptions {
  disputeId: string;
  adminId?: string;
  resolution: "RESOLVED_REFUND_CUSTOMER" | "RESOLVED_PAYOUT_MERCHANT" | "REJECTED";
  resolutionNotes: string;
  refundAmount?: number;
}

/**
 * Creates a dispute on a marketplace order item and automatically freezes merchant payout.
 */
export async function createMarketplaceDispute(options: CreateDisputeOptions) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: options.orderId },
    include: { items: true },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  if (order.customerId !== options.customerId) {
    return { success: false, error: "Unauthorized: You can only dispute your own orders." };
  }

  // Find target item and merchant
  const targetItem = options.orderItemId
    ? order.items.find((i) => i.id === options.orderItemId)
    : order.items[0];

  if (!targetItem) {
    return { success: false, error: "Target order item not found" };
  }

  const disputeNumber = `DISP-MKT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const claimAmount = options.claimAmount || targetItem.totalPrice;

  // Execute in transaction to freeze payout atomically
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create dispute record
    const dispute = await tx.marketplaceDispute.create({
      data: {
        disputeNumber,
        orderId: order.id,
        orderItemId: targetItem.id,
        customerId: options.customerId,
        merchantId: targetItem.merchantId,
        reason: options.reason,
        description: options.description,
        evidencePhotos: JSON.stringify(options.evidencePhotos || []),
        claimAmount,
        status: "OPEN",
      },
    });

    // 2. Freeze merchant payout on the item
    await tx.marketplaceOrderItem.update({
      where: { id: targetItem.id },
      data: {
        merchantPayoutStatus: "FROZEN_DISPUTE",
      },
    });

    // 3. Mark order as DISPUTED
    await tx.marketplaceOrder.update({
      where: { id: order.id },
      data: {
        status: "DISPUTED",
      },
    });

    // 4. Audit Log
    await tx.marketplaceAuditLog.create({
      data: {
        orderId: order.id,
        merchantId: targetItem.merchantId,
        actorId: options.customerId,
        actorRole: "CUSTOMER",
        action: "DISPUTE_OPENED",
        details: JSON.stringify({
          disputeNumber,
          reason: options.reason,
          claimAmount,
        }),
      },
    });

    return dispute;
  });

  return { success: true, dispute: result };
}

/**
 * Admin resolves a dispute, routing funds to customer refund or releasing merchant payout.
 */
export async function resolveMarketplaceDispute(options: ResolveDisputeOptions) {
  const dispute = await prisma.marketplaceDispute.findUnique({
    where: { id: options.disputeId },
    include: { order: true, orderItem: true, customer: true, merchant: true },
  });

  if (!dispute) {
    return { success: false, error: "Dispute record not found" };
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update dispute status
    const updatedDispute = await tx.marketplaceDispute.update({
      where: { id: dispute.id },
      data: {
        status: options.resolution,
        resolutionNotes: options.resolutionNotes,
        refundAmount: options.refundAmount || dispute.claimAmount,
        resolvedByAdminId: options.adminId || "SUPER_ADMIN",
        resolvedAt: now,
      },
    });

    if (options.resolution === "RESOLVED_REFUND_CUSTOMER") {
      // Refund item to customer
      if (dispute.orderItemId) {
        await tx.marketplaceOrderItem.update({
          where: { id: dispute.orderItemId },
          data: {
            merchantPayoutStatus: "REFUNDED",
          },
        });
      }

      // Log refund in MarketplaceAuditLog
      const refundAmt = options.refundAmount || dispute.claimAmount;
      await tx.marketplaceAuditLog.create({
        data: {
          merchantId: dispute.merchantId,
          orderId: dispute.orderId,
          actorId: options.adminId || "SYSTEM_ADMIN",
          actorRole: "ADMIN",
          action: "DISPUTE_CUSTOMER_REFUND",
          details: JSON.stringify({
            disputeId: dispute.id,
            disputeNumber: dispute.disputeNumber,
            refundAmount: refundAmt,
            customerId: dispute.customerId,
            reason: dispute.reason,
            notes: options.resolutionNotes,
          }),
        },
      });

      await tx.marketplaceOrder.update({
        where: { id: dispute.orderId },
        data: {
          status: "REFUNDED",
          paymentStatus: "REFUNDED",
        },
      });
    } else if (options.resolution === "RESOLVED_PAYOUT_MERCHANT") {
      // Unfreeze and disburse payout to merchant
      if (dispute.orderItemId) {
        await tx.marketplaceOrderItem.update({
          where: { id: dispute.orderItemId },
          data: {
            merchantPayoutStatus: "DISBURSED",
            disbursedAt: now,
            disbursementReference: `DISB-DISP-${dispute.disputeNumber}`,
          },
        });
      }

      await tx.marketplaceOrder.update({
        where: { id: dispute.orderId },
        data: {
          status: "DELIVERED",
        },
      });
    }

    // Audit log
    await tx.marketplaceAuditLog.create({
      data: {
        orderId: dispute.orderId,
        merchantId: dispute.merchantId,
        actorId: options.adminId || "ADMIN",
        actorRole: "ADMIN",
        action: "DISPUTE_RESOLVED",
        details: JSON.stringify({
          disputeNumber: dispute.disputeNumber,
          resolution: options.resolution,
          notes: options.resolutionNotes,
        }),
      },
    });

    return updatedDispute;
  });

  return { success: true, dispute: result };
}
