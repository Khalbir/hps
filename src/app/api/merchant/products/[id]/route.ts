import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPriceAnomaly } from "@/lib/fraud-prevention";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.marketplaceProduct.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("[Merchant Product Detail GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const product = await prisma.marketplaceProduct.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const price = body.price !== undefined ? Number(body.price) : product.price;
    const stockQuantity = body.stockQuantity !== undefined ? Number(body.stockQuantity) : product.stockQuantity;

    const anomalyCheck = checkPriceAnomaly({
      categorySlug: product.category.slug,
      price,
    });

    const updated = await prisma.marketplaceProduct.update({
      where: { id },
      data: {
        title: body.title || product.title,
        description: body.description || product.description,
        partNumber: body.partNumber !== undefined ? body.partNumber : product.partNumber,
        brand: body.brand !== undefined ? body.brand : product.brand,
        price,
        compareAtPrice: body.compareAtPrice !== undefined ? Number(body.compareAtPrice) : product.compareAtPrice,
        stockQuantity,
        lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : product.lowStockThreshold,
        status: stockQuantity > 0 ? (body.status || product.status) : "OUT_OF_STOCK",
        priceAnomalyFlag: anomalyCheck.isAnomaly,
        compatibility: body.compatibility ? (typeof body.compatibility === "string" ? body.compatibility : JSON.stringify(body.compatibility)) : product.compatibility,
        specifications: body.specifications ? (typeof body.specifications === "string" ? body.specifications : JSON.stringify(body.specifications)) : product.specifications,
        images: body.images ? (typeof body.images === "string" ? body.images : JSON.stringify(body.images)) : product.images,
        weightKg: body.weightKg !== undefined ? Number(body.weightKg) : product.weightKg,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully!",
      product: updated,
    });
  } catch (error: any) {
    console.error("[Merchant Product PUT Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.marketplaceProduct.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("[Merchant Product DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
