import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/promo-codes
export async function GET() {
  try {
    let promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (promos.length === 0) {
      // Seed initial default promos if empty
      const defaultPromos = [
        {
          code: "WELCOME50",
          discountType: "PERCENTAGE",
          discountValue: 50,
          maxUses: 500,
          usedCount: 42,
          maxDiscount: 5000,
          expiresAt: new Date("2026-12-31"),
          isActive: true,
        },
        {
          code: "HANDY2026",
          discountType: "FIXED",
          discountValue: 2000,
          maxUses: 100,
          usedCount: 18,
          expiresAt: new Date("2026-09-30"),
          isActive: true,
        },
      ];

      for (const dp of defaultPromos) {
        await prisma.promoCode.create({ data: dp }).catch(() => {});
      }

      promos = await prisma.promoCode.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ success: true, promos });
  } catch (error: any) {
    console.error("[Promo Codes GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch promo codes" }, { status: 500 });
  }
}

// POST /api/promo-codes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, discountType = "FIXED", discountValue = 1500, maxUses = 200, expiresAt } = body;

    if (!code) {
      return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
    }

    const newPromo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        maxUses: Number(maxUses),
        usedCount: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date("2026-12-31"),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, promo: newPromo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create promo code" }, { status: 500 });
  }
}

// PATCH /api/promo-codes
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, delta = 1, field } = body;

    if (!id) {
      return NextResponse.json({ error: "Promo ID is required" }, { status: 400 });
    }

    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    let updateData: any = {};

    if (action === "INCREASE_MAX_USES") {
      updateData.maxUses = existing.maxUses + Number(delta);
    } else if (action === "DECREASE_MAX_USES") {
      updateData.maxUses = Math.max(0, existing.maxUses - Number(delta));
    } else if (action === "INCREASE_USED") {
      updateData.usedCount = Math.min(existing.maxUses, existing.usedCount + Number(delta));
    } else if (action === "DECREASE_USED") {
      updateData.usedCount = Math.max(0, existing.usedCount - Number(delta));
    } else if (action === "INCREASE_DISCOUNT") {
      updateData.discountValue = existing.discountValue + Number(delta);
    } else if (action === "DECREASE_DISCOUNT") {
      updateData.discountValue = Math.max(1, existing.discountValue - Number(delta));
    } else if (action === "TOGGLE_ACTIVE") {
      updateData.isActive = !existing.isActive;
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, promo: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update promo code" }, { status: 500 });
  }
}
