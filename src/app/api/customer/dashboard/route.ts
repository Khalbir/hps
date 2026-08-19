import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && email) {
      user = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } } });
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        user: { firstName: "", lastName: "", email: email || "", phone: "" },
        walletBalance: 0,
        activeDispatchesCount: 0,
        totalBookingsCount: 0,
        bookings: [],
      });
    }

    let [wallet, dbBookings] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId: user.id } }),
      prisma.booking.findMany({
        where: { customerId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          professional: { select: { user: { select: { firstName: true, lastName: true } } } },
          service: { select: { name: true } },
        },
      }),
    ]);

    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: user.id, balance: 0 } }).catch(() => null);
    }

    // Auto-reconcile balance from Payment table
    let realBalance = wallet?.balance || 0;
    try {
      const cleanEmail = user.email.toLowerCase().trim();
      const topUpPayments = await prisma.payment.findMany({
        where: {
          OR: [
            { userId: user.id },
            { metadata: { contains: cleanEmail } },
          ],
          status: "SUCCESS",
        },
      });

      const sumTopUps = topUpPayments.reduce((sum, p) => {
        const isTopUp = p.bookingId?.includes("TOPUP") || p.reference?.includes("TOPUP");
        return isTopUp ? sum + p.amount : sum;
      }, 0);

      if (sumTopUps > realBalance) {
        realBalance = sumTopUps;
        if (wallet?.id) {
          await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: sumTopUps } }).catch(() => {});
        }
      }
    } catch (reconcileErr) {
      console.warn("[Customer Dashboard Reconciliation Warning]:", reconcileErr);
    }

    const formattedBookings = dbBookings.map((b) => ({
      id: b.reference,
      service: b.service?.name || "Service Dispatch",
      status: b.status,
      date: new Date(b.createdAt).toLocaleDateString() + ", " + new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: `₦${b.estimatedPrice.toLocaleString()}`,
      pro: b.professional?.user ? `${b.professional.user.firstName} ${b.professional.user.lastName}` : "Pending Assignment",
    }));

    const activeDispatchesCount = dbBookings.filter((b) => ["PENDING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "IN_PROGRESS", "WORK_IN_PROGRESS"].includes(b.status)).length;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        secondaryAddress: user.secondaryAddress || "",
      },
      walletBalance: realBalance,
      activeDispatchesCount,
      totalBookingsCount: dbBookings.length,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("[Customer Dashboard API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch customer dashboard data" }, { status: 500 });
  }
}
