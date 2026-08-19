import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const merchants = await prisma.merchant.findMany({
      include: {
        subscriptionInvoices: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    return NextResponse.json({
      success: true,
      subscriptions: merchants.map((m) => {
        const isExpired = !m.subscriptionExpiresAt || m.subscriptionExpiresAt < now;
        const daysLeft = m.subscriptionExpiresAt
          ? Math.ceil((m.subscriptionExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          merchantId: m.id,
          businessName: m.businessName,
          email: m.email,
          phone: m.phone,
          city: m.city,
          subscriptionStatus: m.subscriptionStatus,
          subscriptionPlan: m.subscriptionPlan,
          subscriptionAmount: m.subscriptionAmount,
          subscriptionStartedAt: m.subscriptionStartedAt,
          subscriptionExpiresAt: m.subscriptionExpiresAt,
          isExpired,
          daysLeft: Math.max(0, daysLeft),
          recentInvoices: m.subscriptionInvoices,
        };
      }),
    });
  } catch (error: any) {
    console.error("[Admin Subscriptions GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantId, grantDays = 30, adminId, reason } = body;

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const now = new Date();
    const baseDate = merchant.subscriptionExpiresAt && merchant.subscriptionExpiresAt > now
      ? merchant.subscriptionExpiresAt
      : now;

    const newExpiry = new Date(baseDate.getTime() + grantDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionStartedAt: merchant.subscriptionStartedAt || now,
        subscriptionExpiresAt: newExpiry,
      },
    });

    await prisma.merchantSubscriptionInvoice.create({
      data: {
        merchantId,
        amount: 0,
        periodStart: baseDate,
        periodEnd: newExpiry,
        status: "PAID",
        paystackReference: `ADMIN-GRANT-${Date.now()}`,
        paidAt: now,
      },
    });

    await prisma.marketplaceAuditLog.create({
      data: {
        merchantId,
        actorId: adminId || "SYSTEM_ADMIN",
        actorRole: "ADMIN",
        action: "SUBSCRIPTION_ADMIN_OVERRIDE",
        details: JSON.stringify({ grantDays, newExpiry: newExpiry.toISOString(), reason }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Granted ${grantDays} subscription days to ${merchant.businessName}!`,
      merchant: updated,
    });
  } catch (error: any) {
    console.error("[Admin Subscriptions POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to grant subscription" }, { status: 500 });
  }
}
