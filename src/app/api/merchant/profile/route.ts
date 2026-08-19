import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const merchantId = searchParams.get("merchantId");

    const whereClause: any = {};
    if (merchantId) whereClause.id = merchantId;
    else if (userId) whereClause.userId = userId;
    else if (email) whereClause.email = email.toLowerCase().trim();

    if (Object.keys(whereClause).length === 0) {
      return NextResponse.json({ error: "Merchant identifier required" }, { status: 400 });
    }

    const merchant = await prisma.merchant.findFirst({
      where: whereClause,
      include: {
        _count: {
          select: {
            products: true,
            orderItems: true,
          },
        },
        subscriptionInvoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant profile not found" }, { status: 404 });
    }

    // Check active subscription condition
    const now = new Date();
    const isSubscriptionActive =
      merchant.subscriptionStatus === "ACTIVE" &&
      merchant.subscriptionExpiresAt &&
      merchant.subscriptionExpiresAt > now;

    return NextResponse.json({
      success: true,
      merchant: {
        ...merchant,
        isSubscriptionActive,
        totalProducts: merchant._count.products,
        totalSales: merchant._count.orderItems,
      },
    });
  } catch (error: any) {
    console.error("[Merchant Profile GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch merchant profile" }, { status: 500 });
  }
}
