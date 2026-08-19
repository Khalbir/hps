import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultMarketplaceCategories } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDefaultMarketplaceCategories();

    const categories = await prisma.marketplaceCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        type: cat.type,
        isActive: cat.isActive,
        productCount: cat._count.products,
      })),
    });
  } catch (error: any) {
    console.error("[Marketplace Categories GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
