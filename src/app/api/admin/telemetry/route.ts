import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Live Revenue from Payment, Booking, and Wallet tables in PostgreSQL
    const [payments, paidBookings, fundedWallets] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: { in: ["SUCCESS", "PAID", "COMPLETED", "SUCCESSFUL", "HELD_IN_ESCROW", "RELEASED"] },
        },
        select: { amount: true, createdAt: true },
      }).catch(() => []),
      prisma.booking.findMany({
        where: {
          OR: [
            { paymentStatus: { in: ["PAID", "HELD_IN_ESCROW", "RELEASED"] } },
            { status: "COMPLETED" },
          ],
        },
        select: { estimatedPrice: true, finalPrice: true, createdAt: true },
      }).catch(() => []),
      prisma.wallet.findMany({
        where: { balance: { gt: 0 } },
        select: { balance: true },
      }).catch(() => []),
    ]);

    const paymentSum = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const bookingSum = paidBookings.reduce((acc, curr) => acc + (curr.finalPrice || curr.estimatedPrice || 0), 0);
    const walletSum = fundedWallets.reduce((acc, curr) => acc + (curr.balance || 0), 0);

    const totalRevenueNgn = Math.max(paymentSum, bookingSum, paymentSum + walletSum);

    // 2. Active Bookings (PENDING, ASSIGNED, ACCEPTED, EN_ROUTE, WORK_IN_PROGRESS)
    const activeBookingsCount = await prisma.booking.count({
      where: {
        status: { in: ["PENDING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "WORK_IN_PROGRESS"] },
      },
    });

    // 3. Verified Artisans & Pending Verifications
    const [verifiedArtisansCount, pendingVerificationsCount, totalPros, prosList] = await Promise.all([
      prisma.professional.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.professional.count({ where: { verificationStatus: { in: ["PENDING", "SUBMITTED", "PENDING_REVIEW"] } } }),
      prisma.professional.count(),
      prisma.professional.findMany({ select: { documents: true } }),
    ]);

    // Calculate real city artisan counts
    const cityArtisans: Record<string, number> = {};
    prosList.forEach((p) => {
      let city = "abuja";
      try {
        if (p.documents) {
          const parsed = JSON.parse(p.documents);
          if (parsed.city) city = parsed.city.toLowerCase().trim();
        }
      } catch {}
      cityArtisans[city] = (cityArtisans[city] || 0) + 1;
    });

    // 4. Open Disputes Count
    const openDisputesCount = await prisma.dispute.count({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    });

    // 5. Completed Jobs Count
    const completedJobsCount = await prisma.booking.count({
      where: { status: "COMPLETED" },
    });

    // 6. Avg Pro Response Time (minutes)
    const proResponseAvg = await prisma.professional.aggregate({
      _avg: { responseTime: true },
    });
    const avgResponseTimeMin = Math.round(proResponseAvg._avg.responseTime || 0);

    // 7. Booking Status Breakdown across all states
    const allBookings = await prisma.booking.findMany({
      select: { status: true, address: true, createdAt: true, estimatedPrice: true, reference: true },
    });

    const statusCounts: Record<string, number> = {
      PENDING: 0,
      ASSIGNED: 0,
      ACCEPTED: 0,
      EN_ROUTE: 0,
      WORK_IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };

    const cityCounts: Record<string, number> = {};

    allBookings.forEach((b) => {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status] += 1;
      } else {
        statusCounts[b.status] = 1;
      }

      let city = "Abuja";
      try {
        if (b.address) {
          const parsed = JSON.parse(b.address);
          if (parsed.city) city = parsed.city;
        }
      } catch {
        if (b.address && b.address.toLowerCase().includes("lagos")) city = "Lagos";
        else if (b.address && b.address.toLowerCase().includes("port harcourt")) city = "Port Harcourt";
        else if (b.address && b.address.toLowerCase().includes("ibadan")) city = "Ibadan";
        else if (b.address && b.address.toLowerCase().includes("kano")) city = "Kano";
      }

      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    const totalBookingsAll = allBookings.length;

    const regionalDistribution = Object.entries(cityCounts).map(([city, count]) => ({
      city,
      count,
      share: totalBookingsAll > 0 ? `${Math.round((count / totalBookingsAll) * 100)}%` : "0%",
    }));

    // 8. Monthly Revenue Breakdown (Current Year)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<string, number> = {};
    months.forEach((m) => (monthlyMap[m] = 0));

    payments.forEach((p: any) => {
      const monthName = months[new Date(p.createdAt).getMonth()];
      if (monthlyMap[monthName] !== undefined) {
        monthlyMap[monthName] += p.amount;
      }
    });

    const revenueMonthly = months.slice(0, new Date().getMonth() + 1).map((m) => ({
      month: m,
      amount: monthlyMap[m] || 0,
    }));

    // 9. Recent Bookings from DB
    const recentBookings = await prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        professional: { include: { user: { select: { firstName: true, lastName: true } } } },
        service: { select: { name: true } },
      },
    });

    // 10. Live Activity Feed from AuditLog
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cityArtisans,
      stats: {
        totalRevenueNgn,
        activeBookingsCount,
        verifiedArtisansCount,
        pendingVerificationsCount,
        openDisputesCount,
        completedJobsCount,
        avgResponseTimeMin,
        totalBookingsAll,
      },
      bookingStatusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
      regionalDistribution,
      revenueMonthly,
      recentBookings: recentBookings.map((b) => ({
        id: b.reference,
        customer: b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : "Client User",
        service: b.service?.name || "HandyHub Service",
        pro: b.professional?.user ? `${b.professional.user.firstName} ${b.professional.user.lastName}` : "Unassigned",
        status: b.status,
        amount: `₦${b.estimatedPrice.toLocaleString()}`,
        date: new Date(b.createdAt).toLocaleDateString(),
      })),
      liveActivityFeed: recentAuditLogs.map((log) => ({
        id: log.id,
        time: new Date(log.createdAt).toLocaleTimeString(),
        event: log.action.replace(/_/g, " "),
        details: log.details || `${log.entity} ID: ${log.entityId || "N/A"}`,
      })),
    });
  } catch (error: any) {
    console.error("[Telemetry API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch live database telemetry" }, { status: 500 });
  }
}
