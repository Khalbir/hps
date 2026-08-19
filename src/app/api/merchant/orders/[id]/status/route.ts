import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addLogisticsTrackingMilestone } from "@/lib/logistics";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, merchantId } = body;

    const order = await prisma.marketplaceOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status if valid transition
    const validStatuses = ["PROCESSING", "READY_FOR_PICKUP", "IN_TRANSIT"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
    }

    const updated = await prisma.marketplaceOrder.update({
      where: { id },
      data: { status },
    });

    await addLogisticsTrackingMilestone({
      orderId: id,
      status: status === "READY_FOR_PICKUP" ? "MERCHANT_PACKED" : "IN_TRANSIT",
      locationName: order.deliveryCity,
      notes: notes || `Order updated to ${status} by verified merchant.`,
    });

    await prisma.marketplaceAuditLog.create({
      data: {
        orderId: id,
        merchantId,
        actorRole: "MERCHANT",
        action: "STATUS_UPDATED",
        details: JSON.stringify({ newStatus: status, notes }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updated,
    });
  } catch (error: any) {
    console.error("[Merchant Order Status POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update order status" }, { status: 500 });
  }
}
