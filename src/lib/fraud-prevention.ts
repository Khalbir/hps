import crypto from "crypto";
import { prisma } from "./prisma";

// Category upper retail benchmark limits for price gouging prevention
export const MARKETPLACE_PRICE_BENCHMARKS: Record<string, { max: number; label: string }> = {
  "replacement-parts": { max: 450000, label: "Certified Replacement Parts" },
  "tools-and-equipment": { max: 800000, label: "Professional Artisan Tools" },
  "building-materials": { max: 1500000, label: "Building Materials" },
  "safety-gear": { max: 150000, label: "Safety & PPE Equipment" },
};

/**
 * Computes SHA-256 hash of an invoice payload or image URL to detect duplicate submissions
 */
export function computeInvoiceHash(payload: string): string {
  return crypto.createHash("sha256").update(payload.trim()).digest("hex");
}

/**
 * Checks whether an invoice or receipt hash has already been used in previous orders
 */
export async function isDuplicateInvoiceHash(hash: string): Promise<{ isDuplicate: boolean; matchedOrderId?: string }> {
  if (!hash) return { isDuplicate: false };

  const existingOrder = await prisma.marketplaceOrder.findFirst({
    where: { invoiceHash: hash },
    select: { id: true, orderNumber: true },
  });

  if (existingOrder) {
    return { isDuplicate: true, matchedOrderId: existingOrder.orderNumber };
  }

  // Also cross-reference with artisan replacement parts receipts
  const existingPart = await prisma.replacementPart.findFirst({
    where: { receiptHash: hash },
    select: { id: true, reference: true },
  });

  if (existingPart) {
    return { isDuplicate: true, matchedOrderId: existingPart.reference };
  }

  return { isDuplicate: false };
}

/**
 * Validates a replacement part product price against category benchmarks and median price
 */
export function checkPriceAnomaly(params: {
  categorySlug: string;
  price: number;
  medianMarketPrice?: number | null;
}): {
  isAnomaly: boolean;
  reason?: string;
  maxAllowed?: number;
} {
  const { categorySlug, price, medianMarketPrice } = params;

  const benchmark = MARKETPLACE_PRICE_BENCHMARKS[categorySlug] || { max: 450000, label: "General Hardware" };

  // 1. Check absolute benchmark cap
  if (price > benchmark.max) {
    return {
      isAnomaly: true,
      reason: `Price ₦${price.toLocaleString()} exceeds the maximum benchmark ceiling of ₦${benchmark.max.toLocaleString()} for ${benchmark.label}.`,
      maxAllowed: benchmark.max,
    };
  }

  // 2. Check deviation from median price if available (flag if > 40% above median)
  if (medianMarketPrice && medianMarketPrice > 0) {
    const deviation = (price - medianMarketPrice) / medianMarketPrice;
    if (deviation > 0.40) {
      return {
        isAnomaly: true,
        reason: `Price ₦${price.toLocaleString()} is ${Math.round(deviation * 100)}% higher than the market median (₦${medianMarketPrice.toLocaleString()}). Flagged for quality & anti-gouging audit.`,
        maxAllowed: Math.round(medianMarketPrice * 1.4),
      };
    }
  }

  return { isAnomaly: false };
}
