import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get("merchantId");

    if (!merchantId) {
      return NextResponse.json({ error: "merchantId is required" }, { status: 400 });
    }

    const orderItems = await prisma.marketplaceOrderItem.findMany({
      where: { merchantId },
      include: {
        product: true,
        order: {
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
            logisticsTrackings: {
              orderBy: { timestamp: "desc" },
            },
          },
        },
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    return NextResponse.json({
      success: true,
      orderItems: orderItems.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        orderNumber: item.order.orderNumber,
        productName: item.product.title,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        merchantPayoutStatus: item.merchantPayoutStatus,
        merchantPayoutAmount: item.merchantPayoutAmount,
        disbursedAt: item.disbursedAt,
        disbursementReference: item.disbursementReference,
        orderStatus: item.order.status,
        paymentStatus: item.order.paymentStatus,
        deliveryAddress: item.order.deliveryAddress,
        deliveryCity: item.order.deliveryCity,
        trackingNumber: item.order.trackingNumber,
        customerName: `${item.order.customer.firstName} ${item.order.customer.lastName}`,
        customerPhone: item.order.customer.phone,
        createdAt: item.order.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("[Merchant Orders GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch merchant orders" }, { status: 500 });
  }
}
