import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SERVICE_CATEGORIES } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbCategories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    if (dbCategories && dbCategories.length > 0) {
      // Enrich with static metadata (colors, keywords) from SERVICE_CATEGORIES
      const enriched = dbCategories.map((c) => {
        const staticMatch = SERVICE_CATEGORIES.find((sc) => sc.id === c.slug || sc.id === c.id);
        return {
          id: c.slug || c.id,
          name: c.name,
          slug: c.slug,
          color: staticMatch?.color || "#00A8B5",
          keywords: staticMatch?.keywords || [],
          services: c.services.map((s) => ({
            id: s.slug || s.id,
            name: s.name,
            price: s.basePrice,
            desc: s.description || "",
            unitLabel: s.priceUnit,
            pricingModel: staticMatch?.services.find((ms) => ms.id === s.slug)?.pricingModel || "FIXED",
          })),
        };
      });

      return NextResponse.json({ categories: enriched, success: true });
    }

    // Graceful fallback to rich code-level SERVICE_CATEGORIES
    return NextResponse.json({ categories: SERVICE_CATEGORIES, success: true });
  } catch (error) {
    console.error("Services fetch error:", error);
    return NextResponse.json({ categories: SERVICE_CATEGORIES, success: true });
  }
}

