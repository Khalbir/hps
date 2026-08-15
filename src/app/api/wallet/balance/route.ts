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
      const cleanEmail = email.trim();
      user = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
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

    // Auto-reconcile and re-link payments associated with this user's email
    try {
      const cleanEmail = user.email.toLowerCase().trim();

      // Find all payments linked to user.id OR containing user's email in metadata
      const userPayments = await prisma.payment.findMany({
        where: {
          OR: [
            { userId: user.id },
            { metadata: { contains: cleanEmail } },
          ],
        },
      });

      let totalTopUpAmount = 0;
      for (const p of userPayments) {
        // Re-link payment to real user ID if unlinked or dummy
        if (p.userId !== user.id) {
          await prisma.payment.update({
            where: { id: p.id },
            data: { userId: user.id },
          }).catch(() => {});
        }

        const isTopUp = p.bookingId?.includes("TOPUP") || p.reference?.includes("TOPUP");
        if (isTopUp && p.status === "SUCCESS") {
          totalTopUpAmount += p.amount;
        }
      }

      if (totalTopUpAmount > wallet.balance) {
        wallet = await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: totalTopUpAmount },
        });
      }
    } catch (reconcileErr) {
      console.warn("[Wallet Balance Reconciliation Warning]:", reconcileErr);
    }

    // Fetch all transactions for history display
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
