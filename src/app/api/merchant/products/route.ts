import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isMerchantActiveAndEligible } from "@/lib/marketplace";
import { checkPriceAnomaly } from "@/lib/fraud-prevention";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get("merchantId");

    if (!merchantId) {
      return NextResponse.json({ error: "merchantId is required" }, { status: 400 });
    }

    const products = await prisma.marketplaceProduct.findMany({
      where: { merchantId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.error("[Merchant Products GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      merchantId,
      categoryId,
      title,
      description,
      partNumber,
      brand,
      compatibility = [],
      specifications = {},
      price,
      compareAtPrice,
      stockQuantity = 1,
      lowStockThreshold = 5,
      images = [],
      weightKg = 0.5,
      dimensions,
    } = body;

    if (!merchantId || !title || !price) {
      return NextResponse.json(
        { error: "Merchant ID, Product Title, and Price are required." },
        { status: 400 }
      );
    }

    // 1. Verify merchant compliance & active monthly subscription
    const eligibility = await isMerchantActiveAndEligible(merchantId);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: `Cannot list product: ${eligibility.reason}` },
        { status: 403 }
      );
    }

    // 2. Resolve Category (Default to Replacement Parts)
    let category = null;
    if (categoryId) {
      category = await prisma.marketplaceCategory.findUnique({ where: { id: categoryId } });
    }
    if (!category) {
      category = await prisma.marketplaceCategory.findFirst({ where: { slug: "replacement-parts" } });
    }

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    // 3. Price Anomaly Check
    const anomalyCheck = checkPriceAnomaly({
      categorySlug: category.slug,
      price: Number(price),
    });

    const sku = `SKU-PRT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const slug = `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

    const product = await prisma.marketplaceProduct.create({
      data: {
        merchantId,
        categoryId: category.id,
        sku,
        title,
        slug,
        description: description || `Certified OEM ${title} replacement component.`,
        partNumber: partNumber || null,
        brand: brand || null,
        compatibility: typeof compatibility === "string" ? compatibility : JSON.stringify(compatibility),
        specifications: typeof specifications === "string" ? specifications : JSON.stringify(specifications),
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: Number(lowStockThreshold),
        images: typeof images === "string" ? images : JSON.stringify(images),
        weightKg: Number(weightKg),
        dimensions: dimensions || null,
        status: Number(stockQuantity) > 0 ? "ACTIVE" : "OUT_OF_STOCK",
        isVerified: true,
        priceAnomalyFlag: anomalyCheck.isAnomaly,
      },
    });

    // 4. Record Audit Log if price anomaly flagged
    if (anomalyCheck.isAnomaly) {
      await prisma.marketplaceAuditLog.create({
        data: {
          merchantId,
          productId: product.id,
          actorId: merchantId,
          actorRole: "MERCHANT",
          action: "PRICE_FLAGGED",
          details: JSON.stringify({
            price,
            reason: anomalyCheck.reason,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: anomalyCheck.isAnomaly
        ? "Product created with price anomaly flag for admin review."
        : "Replacement part published to HandyHub Marketplace! 🚀",
      product,
    });
  } catch (error: any) {
    console.error("[Merchant Product POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
