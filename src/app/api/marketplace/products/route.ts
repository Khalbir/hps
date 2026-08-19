import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultMarketplaceCategories, cleanupExpiredReservations } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureDefaultMarketplaceCategories();
    await cleanupExpiredReservations();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const categorySlug = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "99999999");
    const sort = searchParams.get("sort") || "popular"; // popular, price_asc, price_desc, rating
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "24", 10);

    const whereClause: any = {
      status: "ACTIVE",
      isVerified: true,
      price: { gte: minPrice, lte: maxPrice },
      merchant: {
        verificationStatus: "VERIFIED",
        subscriptionStatus: "ACTIVE",
        isActive: true,
      },
    };

    if (categorySlug && categorySlug !== "all") {
      whereClause.category = { slug: categorySlug };
    }

    if (brand) {
      whereClause.brand = { equals: brand, mode: "insensitive" };
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { partNumber: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };
    if (sort === "stock") orderBy = { stockQuantity: "desc" };

    const total = await prisma.marketplaceProduct.count({ where: whereClause });
    const products = await prisma.marketplaceProduct.findMany({
      where: whereClause,
      include: {
        category: true,
        merchant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            city: true,
            state: true,
            rating: true,
            totalOrders: true,
            verificationStatus: true,
            logoUrl: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      products: products.map((p) => {
        let parsedImages: string[] = [];
        let parsedCompatibility: string[] = [];
        let parsedSpecs: Record<string, any> = {};

        try {
          parsedImages = typeof p.images === "string" ? JSON.parse(p.images) : p.images;
        } catch {}
        try {
          parsedCompatibility = typeof p.compatibility === "string" ? JSON.parse(p.compatibility) : p.compatibility;
        } catch {}
        try {
          parsedSpecs = typeof p.specifications === "string" ? JSON.parse(p.specifications) : p.specifications;
        } catch {}

        return {
          id: p.id,
          sku: p.sku,
          title: p.title,
          slug: p.slug,
          description: p.description,
          partNumber: p.partNumber,
          brand: p.brand,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          stockQuantity: p.stockQuantity,
          weightKg: p.weightKg,
          dimensions: p.dimensions,
          images: Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages : ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60"],
          compatibility: parsedCompatibility,
          specifications: parsedSpecs,
          category: {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
          },
          merchant: p.merchant,
          priceAnomalyFlag: p.priceAnomalyFlag,
        };
      }),
    });
  } catch (error: any) {
    console.error("[Marketplace Products GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
