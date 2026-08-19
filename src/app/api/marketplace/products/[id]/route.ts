import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.marketplaceProduct.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        merchant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            city: true,
            state: true,
            businessAddress: true,
            phone: true,
            rating: true,
            totalOrders: true,
            verificationStatus: true,
            logoUrl: true,
            storePhotoUrl: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let parsedImages: string[] = [];
    let parsedCompatibility: string[] = [];
    let parsedSpecs: Record<string, any> = {};

    try {
      parsedImages = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
    } catch {}
    try {
      parsedCompatibility = typeof product.compatibility === "string" ? JSON.parse(product.compatibility) : product.compatibility;
    } catch {}
    try {
      parsedSpecs = typeof product.specifications === "string" ? JSON.parse(product.specifications) : product.specifications;
    } catch {}

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        sku: product.sku,
        title: product.title,
        slug: product.slug,
        description: product.description,
        partNumber: product.partNumber,
        brand: product.brand,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stockQuantity: product.stockQuantity,
        weightKg: product.weightKg,
        dimensions: product.dimensions,
        images: Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages : ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60"],
        compatibility: parsedCompatibility,
        specifications: parsedSpecs,
        category: product.category,
        merchant: product.merchant,
      },
    });
  } catch (error: any) {
    console.error("[Marketplace Product Detail GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 });
  }
}
