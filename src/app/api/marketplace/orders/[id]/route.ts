import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.marketplaceOrder.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
          { trackingNumber: id },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
            merchant: {
              select: {
                id: true,
                businessName: true,
                businessAddress: true,
                city: true,
                state: true,
                phone: true,
                rating: true,
                logoUrl: true,
              },
            },
          },
        },
        logisticsTrackings: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error("[Marketplace Order GET Detail Error]:", error);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}
