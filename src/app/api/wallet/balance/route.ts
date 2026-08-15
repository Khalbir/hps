import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && email) {
      user = await prisma.user.findFirst({
        where: { email: { equals: email.trim(), mode: "insensitive" } },
      });
    }

    if (!user) {
      return NextResponse.json({
        availableBalance: 0,
        pendingEscrow: 0,
        currency: "NGN",
        history: [],
      });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          pendingEscrow: 0,
        },
      });
    }

    // Auto-reconcile balance from all successful top-ups for this user
    try {
      const topUpPayments = await prisma.payment.findMany({
        where: {
          userId: user.id,
          status: "SUCCESS",
          OR: [
            { bookingId: { contains: "TOPUP" } },
            { reference: { contains: "TOPUP" } },
          ],
        },
      });

      const totalTopUps = topUpPayments.reduce((acc, p) => acc + p.amount, 0);
      if (totalTopUps > wallet.balance) {
        wallet = await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: totalTopUps },
        });
      }
    } catch (reconcileErr) {
      console.warn("[Wallet Balance Reconciliation Warning]:", reconcileErr);
    }

    // Fetch payment top-up history
    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const history = payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      type: p.bookingId?.includes("TOPUP") || p.reference.includes("TOPUP") ? "WALLET_TOPUP" : "SERVICE_PAYMENT",
      amount: p.amount,
      description: p.bookingId?.includes("TOPUP") || p.reference.includes("TOPUP")
        ? `Wallet Top-Up via ${p.provider}`
        : `Service Payment (${p.reference})`,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      currency: "NGN",
      availableBalance: wallet.balance,
      pendingEscrow: wallet.pendingEscrow || 0,
      history,
    });
  } catch (error) {
    console.error("[Wallet Balance API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch wallet balance" }, { status: 500 });
  }
}
