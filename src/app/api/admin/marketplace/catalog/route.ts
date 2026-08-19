import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const anomaliesOnly = searchParams.get("anomalies") === "true";

    const whereClause: any = {};
    if (anomaliesOnly) {
      whereClause.priceAnomalyFlag = true;
    }

    const products = await prisma.marketplaceProduct.findMany({
      where: whereClause,
      include: {
        category: true,
        merchant: {
          select: {
            id: true,
            businessName: true,
            city: true,
            verificationStatus: true,
            subscriptionStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      total: products.length,
      anomaliesCount: products.filter((p) => p.priceAnomalyFlag).length,
      products,
    });
  } catch (error: any) {
    console.error("[Admin Catalog GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, action, adminId } = body; // action: "RESOLVE_ANOMALY" | "SUSPEND" | "ACTIVATE"

    const product = await prisma.marketplaceProduct.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let updateData: any = {};
    if (action === "RESOLVE_ANOMALY") {
      updateData = { priceAnomalyFlag: false };
    } else if (action === "SUSPEND") {
      updateData = { status: "SUSPENDED" };
    } else if (action === "ACTIVATE") {
      updateData = { status: "ACTIVE" };
    }

    const updated = await prisma.marketplaceProduct.update({
      where: { id: productId },
      data: updateData,
    });

    await prisma.marketplaceAuditLog.create({
      data: {
        productId,
        actorId: adminId || "SYSTEM_ADMIN",
        actorRole: "ADMIN",
        action: `PRODUCT_${action}`,
        details: JSON.stringify({ action, productId, timestamp: new Date().toISOString() }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Product action ${action} executed successfully.`,
      product: updated,
    });
  } catch (error: any) {
    console.error("[Admin Catalog Action POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}
