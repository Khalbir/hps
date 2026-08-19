import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveMarketplaceRegions, ensureDefaultMarketplaceRegionsAndZones } from "@/lib/regions";

export async function GET() {
  try {
    await ensureDefaultMarketplaceRegionsAndZones();

    const [activeRegions, allRegions] = await Promise.all([
      getActiveMarketplaceRegions(),
      prisma.marketplaceRegion.findMany({
        orderBy: { order: "asc" },
        include: {
          serviceZones: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      activeRegions,
      allRegions,
      currentScope: "ABUJA_ONLY",
      message: "HandyHub Marketplace physical fulfillment is currently active in Abuja (FCT) only.",
    });
  } catch (error: any) {
    console.error("[Marketplace Regions API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load regions and service zones." },
      { status: 500 }
    );
  }
}
