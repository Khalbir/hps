import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const email = searchParams.get("email");

    const whereClause: any = {};
    if (customerId) {
      whereClause.customerId = customerId;
    } else if (email) {
      whereClause.customer = { email: email.toLowerCase().trim() };
    }

    const orders = await prisma.marketplaceOrder.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
            merchant: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                city: true,
              },
            },
          },
        },
        logisticsTrackings: {
          orderBy: { timestamp: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error("[Marketplace Orders GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
