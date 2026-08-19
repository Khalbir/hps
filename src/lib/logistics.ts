import crypto from "crypto";
import { prisma } from "./prisma";
import { calculateHaversineDistanceKm, LatLng } from "./location";

export const BASE_LOGISTICS_FEE = 1500; // ₦1,500 base rate within 10 km
export const PER_KM_SURCHARGE = 150; // ₦150 per km beyond 10 km
export const HEAVY_WEIGHT_THRESHOLD_KG = 5;
export const HEAVY_SURCHARGE_PER_KG = 300; // ₦300/kg surcharge for heavy replacement parts (e.g. AC compressors)

export interface LogisticsCalculationResult {
  logisticsFee: number;
  distanceKm: number;
  isIntraZone: boolean;
  estimatedMinutes: number;
  currency: string;
}

/**
 * Calculates dynamic logistics delivery fee
 */
export function calculateLogisticsFee(params: {
  pickupCoords?: LatLng | null;
  deliveryCoords?: LatLng | null;
  weightKg?: number;
  deliveryCity?: string;
}): LogisticsCalculationResult {
  const { pickupCoords, deliveryCoords, weightKg = 1 } = params;

  const defaultCenter: LatLng = { lat: 9.0765, lng: 7.4723 }; // Central Abuja
  const pickup = pickupCoords || defaultCenter;
  const delivery = deliveryCoords || defaultCenter;

  const distanceKm = calculateHaversineDistanceKm(pickup, delivery);
  const isIntraZone = distanceKm <= 10;

  let fee = BASE_LOGISTICS_FEE;

  if (distanceKm > 10) {
    const extraDistance = distanceKm - 10;
    fee += Math.round(extraDistance * PER_KM_SURCHARGE);
  }

  // Weight surcharge for heavy items
  if (weightKg > HEAVY_WEIGHT_THRESHOLD_KG) {
    const extraWeight = weightKg - HEAVY_WEIGHT_THRESHOLD_KG;
    fee += Math.round(extraWeight * HEAVY_SURCHARGE_PER_KG);
  }

  // Round up to nearest ₦100
  const finalFee = Math.ceil(fee / 100) * 100;

  // Estimated delivery time: base 30 mins + 3 mins per km
  const estimatedMinutes = Math.round(30 + distanceKm * 3);

  return {
    logisticsFee: finalFee,
    distanceKm,
    isIntraZone,
    estimatedMinutes,
    currency: "NGN",
  };
}

/**
 * Generates a 6-digit numeric OTP for delivery confirmation
 */
export function generateDeliveryOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Creates tracking milestone for a marketplace order
 */
export async function addLogisticsTrackingMilestone(params: {
  orderId: string;
  status:
    | "ORDER_CONFIRMED"
    | "MERCHANT_PACKED"
    | "DISPATCH_ASSIGNED"
    | "COURIER_PICKED_UP"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED";
  locationName: string;
  notes?: string;
  riderName?: string;
  riderPhone?: string;
}) {
  const { orderId, status, locationName, notes, riderName, riderPhone } = params;

  return await prisma.marketplaceLogisticsTracking.create({
    data: {
      orderId,
      status,
      locationName,
      notes,
      riderName: riderName || "HandyHub Express Dispatch Rider",
      riderPhone: riderPhone || "+234800HANDYHUB",
    },
  });
}

/**
 * Verifies Customer 6-Digit Delivery OTP and releases merchant payout
 */
export async function verifyOrderDeliveryOtp(params: {
  orderId: string;
  submittedOtp: string;
  actorId?: string;
}): Promise<{ success: boolean; error?: string; order?: any }> {
  const { orderId, submittedOtp, actorId } = params;

  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { merchant: true, product: true },
      },
      customer: true,
    },
  });

  if (!order) {
    return { success: false, error: "Marketplace order not found." };
  }

  if (order.status === "DELIVERED" && order.otpVerified) {
    return { success: true, order };
  }

  if (order.deliveryOtp !== submittedOtp.trim()) {
    return { success: false, error: "Invalid delivery confirmation OTP code." };
  }

  const now = new Date();

  // Atomically update order to DELIVERED, mark items DISBURSED, and record audit log
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // 1. Mark order as DELIVERED
    const ord = await tx.marketplaceOrder.update({
      where: { id: order.id },
      data: {
        status: "DELIVERED",
        otpVerified: true,
        deliveredAt: now,
      },
    });

    // 2. Mark order items payout as DISBURSED to merchant
    for (const item of order.items) {
      await tx.marketplaceOrderItem.update({
        where: { id: item.id },
        data: {
          merchantPayoutStatus: "DISBURSED",
          disbursedAt: now,
          disbursementReference: `DISB-MKT-${order.orderNumber}-${item.id.slice(-4)}`,
        },
      });

      // Increment merchant total completed orders
      await tx.merchant.update({
        where: { id: item.merchantId },
        data: { totalOrders: { increment: 1 } },
      });
    }

    // 3. Add DELIVERED logistics milestone
    await tx.marketplaceLogisticsTracking.create({
      data: {
        orderId: order.id,
        status: "DELIVERED",
        locationName: order.deliveryCity || "Abuja",
        notes: "Delivery confirmed via customer 6-digit OTP authentication. Merchant payout released from Procurement Account.",
      },
    });

    // 4. Audit Log
    await tx.marketplaceAuditLog.create({
      data: {
        orderId: order.id,
        actorId: actorId || order.customerId,
        actorRole: "CUSTOMER",
        action: "DELIVERY_CONFIRMED",
        details: JSON.stringify({
          orderNumber: order.orderNumber,
          otpVerified: true,
          deliveredAt: now.toISOString(),
          payoutDisbursed: true,
        }),
      },
    });

    return ord;
  });

  return { success: true, order: updatedOrder };
}
