import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultMarketplaceRegionsAndZones } from "@/lib/regions";

export async function GET() {
  try {
    await ensureDefaultMarketplaceRegionsAndZones();

    const regions = await prisma.marketplaceRegion.findMany({
      orderBy: { order: "asc" },
      include: {
        serviceZones: {
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { merchants: true, orders: true },
            },
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      regions,
    });
  } catch (error: any) {
    console.error("[Admin Marketplace Regions API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load admin regions." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, regionId, zoneId, isMarketplaceActive, zoneData } = body;

    if (action === "TOGGLE_REGION_ACTIVE") {
      if (!regionId) {
        return NextResponse.json({ error: "Region ID is required." }, { status: 400 });
      }

      const updated = await prisma.marketplaceRegion.update({
        where: { id: regionId },
        data: { isMarketplaceActive: Boolean(isMarketplaceActive) },
      });

      return NextResponse.json({
        success: true,
        message: `Region "${updated.name}" is now ${updated.isMarketplaceActive ? "ACTIVE" : "INACTIVE"}.`,
        region: updated,
      });
    }

    if (action === "ADD_ZONE") {
      if (!regionId || !zoneData?.name || !zoneData?.slug) {
        return NextResponse.json({ error: "Region ID, Zone Name, and Slug are required." }, { status: 400 });
      }

      const created = await prisma.marketplaceServiceZone.create({
        data: {
          regionId,
          name: zoneData.name,
          slug: zoneData.slug,
          centerLatitude: parseFloat(zoneData.centerLatitude || 9.0765),
          centerLongitude: parseFloat(zoneData.centerLongitude || 7.4723),
          coverageRadiusKm: parseFloat(zoneData.coverageRadiusKm || 8.0),
          baseLogisticsFee: parseFloat(zoneData.baseLogisticsFee || 1500),
          estimatedDeliveryHours: parseFloat(zoneData.estimatedDeliveryHours || 2.0),
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Service Zone "${created.name}" created successfully.`,
        zone: created,
      });
    }

    if (action === "UPDATE_ZONE") {
      if (!zoneId) {
        return NextResponse.json({ error: "Zone ID is required." }, { status: 400 });
      }

      const updated = await prisma.marketplaceServiceZone.update({
        where: { id: zoneId },
        data: {
          name: zoneData.name,
          baseLogisticsFee: parseFloat(zoneData.baseLogisticsFee),
          coverageRadiusKm: parseFloat(zoneData.coverageRadiusKm),
          estimatedDeliveryHours: parseFloat(zoneData.estimatedDeliveryHours),
          isActive: zoneData.isActive !== undefined ? Boolean(zoneData.isActive) : undefined,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Service Zone "${updated.name}" updated successfully.`,
        zone: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Marketplace Regions Action Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update region/zone." },
      { status: 500 }
    );
  }
}
