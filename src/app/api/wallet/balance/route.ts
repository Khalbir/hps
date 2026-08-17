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

    // Fetch real ledger records from WalletTransaction table
    const [walletTxs, payments] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.payment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    // Build unified history
    const history = walletTxs.map((tx) => ({
      id: tx.id,
      reference: tx.reference || `TX_${tx.id}`,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      status: "SUCCESS",
      gateway: tx.gateway || "WALLET",
      createdAt: tx.createdAt.toISOString(),
    }));

    // If no wallet transactions yet, fallback to payments
    if (history.length === 0) {
      payments.forEach((p) => {
        history.push({
          id: p.id,
          reference: p.reference,
          type: p.bookingId?.includes("TOPUP") || p.reference.includes("TOPUP") ? "WALLET_TOPUP" : "SERVICE_PAYMENT",
          amount: p.amount,
          description: p.bookingId?.includes("TOPUP") || p.reference.includes("TOPUP")
            ? `Wallet Top-Up via ${p.provider}`
            : `Service Payment (${p.reference})`,
          status: p.status,
          gateway: p.provider,
          createdAt: p.createdAt.toISOString(),
        });
      });
    }

    // Compute lifetime earnings from escrow releases
    const lifetimeReleases = walletTxs
      .filter((t) => t.type === "ESCROW_RELEASE" || t.type === "CREDIT")
      .reduce((acc, t) => acc + t.amount, 0);

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      currency: "NGN",
      availableBalance: wallet.balance,
      pendingEscrow: wallet.pendingEscrow || 0,
      lifetimeEarnings: lifetimeReleases || wallet.balance,
      history,
    });
  } catch (error) {
    console.error("[Wallet Balance API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch wallet balance" }, { status: 500 });
  }
}
