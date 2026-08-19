import { prisma } from "./prisma";
import { calculateHaversineDistanceKm, LatLng } from "./location";

export const STANDARD_SUBSCRIPTION_AMOUNT = 15000; // ₦15,000 / Month
export const SUBSCRIPTION_GRACE_PERIOD_DAYS = 3;
export const RESERVATION_TTL_MINUTES = 15;

/**
 * Seed Default Marketplace Categories
 * Phase 1: REPLACEMENT_PARTS is active.
 * Future categories (TOOLS, MATERIALS, EQUIPMENT) are architected but marked inactive.
 */
export async function ensureDefaultMarketplaceCategories() {
  const existingCount = await prisma.marketplaceCategory.count();
  if (existingCount > 0) return;

  const categories = [
    // Phase 1 Active: Replacement Parts
    {
      name: "Replacement Parts",
      slug: "replacement-parts",
      icon: "Wrench",
      description: "OEM & Certified replacement components for plumbing, electrical, AC, and home repairs.",
      type: "REPLACEMENT_PARTS",
      isActive: true,
      order: 1,
    },
    // Future Expansion Categories (Architected & Dormant)
    {
      name: "Tools & Diagnostic Equipment",
      slug: "tools-and-equipment",
      icon: "Hammer",
      description: "Professional artisan power tools, hand tools, and digital multimeters (Future Expansion).",
      type: "TOOLS",
      isActive: false,
      order: 2,
    },
    {
      name: "Building Materials & Hardware",
      slug: "building-materials",
      icon: "Layers",
      description: "Bulk cement, tiles, timber, fasteners, and masonry supplies (Future Expansion).",
      type: "MATERIALS",
      isActive: false,
      order: 3,
    },
    {
      name: "Safety & Workwear (PPE)",
      slug: "safety-gear",
      icon: "ShieldAlert",
      description: "Artisan safety boots, high-vis vests, helmets, and protective gloves (Future Expansion).",
      type: "EQUIPMENT",
      isActive: false,
      order: 4,
    },
  ];

  for (const cat of categories) {
    await prisma.marketplaceCategory.upsert({
      where: { slug: cat.slug },
      update: { isActive: cat.isActive },
      create: cat,
    });
  }
}

/**
 * Verify if merchant is compliant and eligible to list & sell
 */
export async function isMerchantActiveAndEligible(merchantId: string): Promise<{
  eligible: boolean;
  reason?: string;
  merchant?: any;
}> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) {
    return { eligible: false, reason: "Merchant profile not found." };
  }

  if (merchant.verificationStatus !== "VERIFIED") {
    return {
      eligible: false,
      reason: "Merchant business verification is pending or rejected. CAC and physical store must be verified.",
      merchant,
    };
  }

  // Check Subscription Expiry
  const now = new Date();
  if (!merchant.subscriptionExpiresAt || merchant.subscriptionExpiresAt < now) {
    // Check if within 3-day grace period
    if (merchant.subscriptionExpiresAt) {
      const graceEnd = new Date(merchant.subscriptionExpiresAt.getTime() + SUBSCRIPTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      if (now > graceEnd) {
        if (merchant.subscriptionStatus !== "SUSPENDED" && merchant.subscriptionStatus !== "EXPIRED") {
          await prisma.merchant.update({
            where: { id: merchant.id },
            data: { subscriptionStatus: "EXPIRED" },
          });
        }
        return {
          eligible: false,
          reason: "Merchant monthly subscription has expired. Please renew to resume listing products.",
          merchant,
        };
      }
    } else {
      return {
        eligible: false,
        reason: "Active monthly subscription required before publishing products.",
        merchant,
      };
    }
  }

  return { eligible: true, merchant };
}

/**
 * 15-Minute Inventory Reservation Lock
 * Prevents overselling during checkout by placing a temporary reservation.
 */
export async function reserveProductInventory(params: {
  productId: string;
  customerId: string;
  cartSessionId: string;
  quantity: number;
}): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  const { productId, customerId, cartSessionId, quantity } = params;

  // 1. Release any expired reservations first
  await cleanupExpiredReservations();

  // 2. Fetch product & check available stock considering existing active reservations
  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: productId },
    include: {
      merchant: true,
      reservations: {
        where: {
          status: "RESERVED",
          reservedUntil: { gt: new Date() },
          cartSessionId: { not: cartSessionId }, // Exclude current user's session
        },
      },
    },
  });

  if (!product) {
    return { success: false, error: "Product not found." };
  }

  // Verify merchant eligibility
  const eligibility = await isMerchantActiveAndEligible(product.merchantId);
  if (!eligibility.eligible) {
    return { success: false, error: `Merchant is not eligible to sell: ${eligibility.reason}` };
  }

  const reservedCount = product.reservations.reduce((sum, r) => sum + r.quantity, 0);
  const availableStock = product.stockQuantity - reservedCount;

  if (availableStock < quantity) {
    return {
      success: false,
      error: `Insufficient stock. Only ${Math.max(0, availableStock)} available for immediate procurement.`,
    };
  }

  // 3. Create or update reservation for 15 minutes
  const reservedUntil = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

  // Check if session already holds a reservation on this item
  const existingReservation = await prisma.inventoryReservation.findFirst({
    where: {
      productId,
      cartSessionId,
      status: "RESERVED",
    },
  });

  let reservation;
  if (existingReservation) {
    reservation = await prisma.inventoryReservation.update({
      where: { id: existingReservation.id },
      data: {
        quantity,
        reservedUntil,
      },
    });
  } else {
    reservation = await prisma.inventoryReservation.create({
      data: {
        productId,
        customerId,
        cartSessionId,
        quantity,
        reservedUntil,
        status: "RESERVED",
      },
    });
  }

  return { success: true, reservationId: reservation.id };
}

/**
 * Commit Inventory Reservation on Payment Success
 */
export async function commitInventoryReservation(cartSessionId: string, orderId: string) {
  const activeReservations = await prisma.inventoryReservation.findMany({
    where: {
      cartSessionId,
      status: "RESERVED",
    },
  });

  for (const res of activeReservations) {
    // Atomically decrement stock and commit reservation
    await prisma.$transaction(async (tx) => {
      await tx.marketplaceProduct.update({
        where: { id: res.productId },
        data: {
          stockQuantity: { decrement: res.quantity },
        },
      });
      await tx.inventoryReservation.update({
        where: { id: res.id },
        data: { status: "COMMITTED" },
      });
      await tx.marketplaceAuditLog.create({
        data: {
          orderId,
          productId: res.productId,
          actorRole: "SYSTEM",
          action: "INVENTORY_COMMITTED",
          details: JSON.stringify({
            quantity: res.quantity,
            cartSessionId,
            committedAt: new Date().toISOString(),
          }),
        },
      });
    });
  }
}

/**
 * Cleanup Expired Reservations (Releases stock back into pool)
 */
export async function cleanupExpiredReservations() {
  const expired = await prisma.inventoryReservation.updateMany({
    where: {
      status: "RESERVED",
      reservedUntil: { lt: new Date() },
    },
    data: { status: "RELEASED" },
  });

  return expired.count;
}

/**
 * HandyHub Smart Select (Auto-Procurement Algorithm)
 * Algorithmically matches best verified merchant for replacement parts
 */
export async function autoProcureBestMerchant(params: {
  categoryId?: string;
  categorySlug?: string;
  partKeyword: string;
  deliveryCoords?: LatLng;
  requiredQuantity?: number;
}): Promise<{
  matched: boolean;
  product?: any;
  merchant?: any;
  score?: number;
  reason?: string;
}> {
  const { categorySlug, partKeyword, deliveryCoords, requiredQuantity = 1 } = params;

  // Clean expired reservations
  await cleanupExpiredReservations();

  // Find candidate products matching search & category
  const candidates = await prisma.marketplaceProduct.findMany({
    where: {
      status: "ACTIVE",
      stockQuantity: { gte: requiredQuantity },
      isVerified: true,
      priceAnomalyFlag: false, // Exclude flagged anomaly prices
      OR: [
        { title: { contains: partKeyword, mode: "insensitive" } },
        { description: { contains: partKeyword, mode: "insensitive" } },
        { partNumber: { contains: partKeyword, mode: "insensitive" } },
        { brand: { contains: partKeyword, mode: "insensitive" } },
      ],
      merchant: {
        verificationStatus: "VERIFIED",
        subscriptionStatus: "ACTIVE",
        isActive: true,
      },
      category: categorySlug ? { slug: categorySlug } : undefined,
    },
    include: {
      merchant: true,
      category: true,
    },
  });

  if (candidates.length === 0) {
    return {
      matched: false,
      reason: `No verified merchants currently have "${partKeyword}" in stock under active subscription.`,
    };
  }

  // Multi-Factor Scoring:
  // 1. Proximity to delivery address (50% weight)
  // 2. Price competitiveness (30% weight)
  // 3. Merchant Rating (20% weight)
  const defaultCenter: LatLng = { lat: 9.0765, lng: 7.4723 }; // Central Abuja
  const userLoc = deliveryCoords || defaultCenter;

  const scored = candidates.map((item) => {
    const merchantLoc: LatLng = {
      lat: item.merchant.latitude || 9.0765,
      lng: item.merchant.longitude || 7.4723,
    };

    const distanceKm = calculateHaversineDistanceKm(userLoc, merchantLoc);
    const distanceScore = Math.max(0, 100 - distanceKm * 4); // 0km = 100, 25km = 0
    const ratingScore = (item.merchant.rating / 5) * 100; // 5.0 = 100
    const priceScore = Math.max(0, 100 - (item.price / 1000)); // Lower price gets higher score

    const totalScore = distanceScore * 0.5 + priceScore * 0.3 + ratingScore * 0.2;

    return {
      product: item,
      merchant: item.merchant,
      distanceKm,
      score: Math.round(totalScore * 10) / 10,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const bestMatch = scored[0];
  return {
    matched: true,
    product: bestMatch.product,
    merchant: bestMatch.merchant,
    score: bestMatch.score,
  };
}
