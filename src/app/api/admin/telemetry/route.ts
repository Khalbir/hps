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

    // 3. Verified Artisans, Pending Verifications, and Online Artisans
    const [allDbPros, proUsersList] = await Promise.all([
      prisma.professional.findMany({
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, isVerified: true, role: true, ninStatus: true },
          },
        },
      }).catch(() => []),
      prisma.user.findMany({
        where: { role: "PROFESSIONAL" },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, isVerified: true, ninStatus: true },
      }).catch(() => []),
    ]);

    // Build unified map to deduplicate and accurately track all artisans
    const unifiedProMap = new Map<string, any>();
    allDbPros.forEach((p) => {
      const key = p.userId || p.id;
      unifiedProMap.set(key, p);
    });
    proUsersList.forEach((u) => {
      if (!unifiedProMap.has(u.id)) {
        unifiedProMap.set(u.id, {
          id: `pro_${u.id}`,
          userId: u.id,
          verificationStatus: u.isVerified ? "VERIFIED" : "PENDING",
          isAvailable: true,
          rating: 4.5,
          user: u,
          skills: JSON.stringify(["Skilled Services"]),
          documents: "{}",
        });
      }
    });

    const allArtisansList = Array.from(unifiedProMap.values());
    const totalArtisansCount = allArtisansList.length;

    let verifiedArtisansCount = 0;
    let pendingVerificationsCount = 0;
    let rejectedArtisansCount = 0;
    let onlineArtisansCount = 0;
    const onlineArtisansList: any[] = [];
    const cityArtisans: Record<string, number> = {};

    allArtisansList.forEach((p) => {
      const rawStatus = (p.verificationStatus || "").toUpperCase();
      const rawUserStatus = (p.user?.ninStatus || "").toUpperCase();
      const isVerified = rawStatus === "VERIFIED" || rawStatus === "APPROVED" || rawUserStatus === "VERIFIED" || Boolean(p.user?.isVerified);
      const isRejected = rawStatus === "REJECTED" || rawUserStatus === "REJECTED";
      const isAvailable = p.isAvailable !== false; // Default true if not explicitly false

      if (isVerified) {
        verifiedArtisansCount += 1;
      } else if (isRejected) {
        rejectedArtisansCount += 1;
      } else {
        pendingVerificationsCount += 1;
      }

      if (isAvailable) {
        onlineArtisansCount += 1;
      }

      // City calculation
      let city = "Abuja";
      let skills = "General Services";
      try {
        if (p.documents) {
          const parsed = typeof p.documents === "string" ? JSON.parse(p.documents) : p.documents;
          if (parsed.city) city = parsed.city;
          else if (parsed.operatingState) city = parsed.operatingState;
          if (parsed.serviceCategory) skills = parsed.serviceCategory;
        }
        if (skills === "General Services" && p.skills) {
          const parsedSkills = typeof p.skills === "string" ? JSON.parse(p.skills) : p.skills;
          if (Array.isArray(parsedSkills) && parsedSkills.length > 0) skills = parsedSkills.join(", ");
        }
      } catch {}

      const normalizedCityKey = city.toLowerCase().trim();
      cityArtisans[normalizedCityKey] = (cityArtisans[normalizedCityKey] || 0) + 1;

      if (isAvailable) {
        const u = p.user || {};
        onlineArtisansList.push({
          id: p.id,
          userId: p.userId || u.id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Artisan Partner",
          phone: u.phone || "N/A",
          email: u.email || "",
          trade: skills,
          city,
          rating: p.rating || 4.5,
          verificationStatus: isVerified ? "VERIFIED" : isRejected ? "REJECTED" : "PENDING",
          isVerified,
          isAvailable: true,
        });
      }
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
      take: 6,
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    // 11. Users & Clients Count
    const [totalUsersCount, registeredClientsCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cityArtisans,
      onlineArtisansList,
      stats: {
        totalRevenueNgn,
        activeBookingsCount,
        verifiedArtisansCount,
        pendingVerificationsCount,
        onlineArtisansCount,
        totalArtisansCount,
        openDisputesCount,
        completedJobsCount,
        avgResponseTimeMin,
        totalBookingsAll,
        totalUsersCount,
        registeredClientsCount,
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
