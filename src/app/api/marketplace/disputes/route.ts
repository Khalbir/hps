import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMarketplaceDispute } from "@/lib/disputes";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const orderId = searchParams.get("orderId");

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (orderId) where.orderId = orderId;

    const disputes = await prisma.marketplaceDispute.findMany({
      where,
      include: {
        order: true,
        orderItem: {
          include: {
            product: true,
          },
        },
        merchant: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      disputes,
    });
  } catch (error: any) {
    console.error("[Marketplace Disputes API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch disputes." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, orderItemId, customerId, reason, description, evidencePhotos, claimAmount } = body;

    if (!orderId || !customerId || !reason || !description) {
      return NextResponse.json(
        { error: "Order ID, Customer ID, Dispute Reason, and Description are required." },
        { status: 400 }
      );
    }

    const result = await createMarketplaceDispute({
      orderId,
      orderItemId,
      customerId,
      reason,
      description,
      evidencePhotos,
      claimAmount,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Dispute opened successfully. Merchant payout has been held in escrow for investigation.",
      dispute: result.dispute,
    });
  } catch (error: any) {
    console.error("[Create Marketplace Dispute API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit dispute." },
      { status: 500 }
    );
  }
}
