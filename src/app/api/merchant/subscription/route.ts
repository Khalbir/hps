import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STANDARD_SUBSCRIPTION_AMOUNT } from "@/lib/marketplace";
import { initializePaystackTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantId, email, action = "INITIALIZE", reference } = body;

    const merchant = await prisma.merchant.findFirst({
      where: {
        OR: [
          merchantId ? { id: merchantId } : undefined,
          email ? { email: email.toLowerCase().trim() } : undefined,
        ].filter(Boolean) as any,
      },
      include: { user: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found." }, { status: 404 });
    }

    const amount = STANDARD_SUBSCRIPTION_AMOUNT;

    // Action: VERIFY (e.g. after Paystack callback or webhook)
    if (action === "VERIFY" && reference) {
      const now = new Date();
      // Start 30-day period from current expiry date if active, or from today
      const currentExpiry = merchant.subscriptionExpiresAt && merchant.subscriptionExpiresAt > now
        ? merchant.subscriptionExpiresAt
        : now;
      
      const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [updatedMerchant, invoice] = await prisma.$transaction([
        prisma.merchant.update({
          where: { id: merchant.id },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionAmount: amount,
            subscriptionStartedAt: merchant.subscriptionStartedAt || now,
            subscriptionExpiresAt: newExpiry,
            lastPaymentReference: reference,
          },
        }),
        prisma.merchantSubscriptionInvoice.create({
          data: {
            merchantId: merchant.id,
            amount,
            periodStart: currentExpiry,
            periodEnd: newExpiry,
            status: "PAID",
            paystackReference: reference,
            paidAt: now,
          },
        }),
        prisma.marketplaceAuditLog.create({
          data: {
            merchantId: merchant.id,
            actorId: merchant.userId,
            actorRole: "MERCHANT",
            action: "SUBSCRIPTION_RENEWED",
            details: JSON.stringify({
              amount,
              reference,
              newExpiry: newExpiry.toISOString(),
            }),
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Merchant subscription successfully renewed for 30 days! 🎉",
        merchant: updatedMerchant,
        invoice,
      });
    }

    // Action: INITIALIZE
    const subReference = `SUB-MKT-${merchant.id.slice(-6)}-${Date.now()}`;
    const paystackRes = await initializePaystackTransaction({
      email: merchant.email || merchant.user.email,
      amountNgn: amount,
      reference: subReference,
      callbackUrl: `${process.env.NEXTAUTH_URL || "https://handyhubpro.ng"}/merchant/dashboard?subscribed=1&ref=${subReference}`,
      metadata: {
        merchantId: merchant.id,
        businessName: merchant.businessName,
        type: "MERCHANT_SUBSCRIPTION",
      },
    });

    return NextResponse.json({
      success: true,
      amount,
      reference: subReference,
      authorizationUrl: paystackRes.authorizationUrl,
    });
  } catch (error: any) {
    console.error("[Merchant Subscription POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to process subscription" }, { status: 500 });
  }
}
