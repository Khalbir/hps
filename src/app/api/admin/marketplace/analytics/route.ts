import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      orders,
      merchants,
      productsCount,
      anomaliesCount,
      recentOrders,
    ] = await Promise.all([
      prisma.marketplaceOrder.findMany({
        select: {
          id: true,
          subtotal: true,
          logisticsFee: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),
      prisma.merchant.findMany({
        select: {
          id: true,
          verificationStatus: true,
          subscriptionStatus: true,
          subscriptionExpiresAt: true,
        },
      }),
      prisma.marketplaceProduct.count(),
      prisma.marketplaceProduct.count({ where: { priceAnomalyFlag: true } }),
      prisma.marketplaceOrder.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { firstName: true, lastName: true, phone: true },
          },
          items: {
            include: {
              product: { select: { title: true, sku: true } },
              merchant: { select: { businessName: true } },
            },
          },
        },
      }),
    ]);

    const totalGMV = orders.reduce((sum, o) => sum + (o.paymentStatus === "PAID" ? o.subtotal : 0), 0);
    const totalLogisticsFees = orders.reduce((sum, o) => sum + (o.paymentStatus === "PAID" ? o.logisticsFee : 0), 0);
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter((o) => o.status === "DELIVERED").length;
    const deliveryRate = totalOrdersCount > 0 ? Math.round((completedOrders / totalOrdersCount) * 100) : 100;

    const now = new Date();
    const activeSubscriptions = merchants.filter(
      (m) => m.subscriptionStatus === "ACTIVE" && m.subscriptionExpiresAt && m.subscriptionExpiresAt > now
    ).length;

    const pendingMerchants = merchants.filter((m) => m.verificationStatus === "PENDING").length;

    return NextResponse.json({
      success: true,
      analytics: {
        totalGMV,
        totalLogisticsFees,
        totalOrdersCount,
        completedOrders,
        deliveryRate,
        totalMerchants: merchants.length,
        pendingMerchants,
        activeSubscriptions,
        productsCount,
        anomaliesCount,
      },
      recentOrders,
    });
  } catch (error: any) {
    console.error("[Admin Marketplace Analytics GET Error]:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
