import { NextRequest, NextResponse } from "next/server";
import { reserveProductInventory } from "@/lib/marketplace";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, customerId, cartSessionId, quantity = 1 } = body;

    if (!productId || !cartSessionId) {
      return NextResponse.json(
        { error: "Missing required fields: productId and cartSessionId are required." },
        { status: 400 }
      );
    }

    const res = await reserveProductInventory({
      productId,
      customerId: customerId || "guest_customer",
      cartSessionId,
      quantity: Number(quantity),
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      reservationId: res.reservationId,
      reservedUntilMinutes: 15,
      message: "Inventory successfully reserved for 15 minutes during checkout.",
    });
  } catch (error: any) {
    console.error("[Marketplace Reserve POST Error]:", error);
    return NextResponse.json({ error: "Failed to reserve inventory" }, { status: 500 });
  }
}
