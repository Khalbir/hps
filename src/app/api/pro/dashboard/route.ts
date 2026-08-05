import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json({
        success: true,
        proName: "Artisan Partner",
        verificationStatus: "PENDING",
        walletBalance: 0,
        pendingEscrow: 0,
        completedJobs: 0,
        rating: 5.0,
        activeJobs: [],
      });
    }

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        proName: "Artisan Partner",
        verificationStatus: "PENDING",
        walletBalance: 0,
        pendingEscrow: 0,
        completedJobs: 0,
        rating: 5.0,
        activeJobs: [],
      });
    }

    // Find Professional record & Wallet
    const [pro, wallet] = await Promise.all([
      prisma.professional.findUnique({ where: { userId: user.id } }),
      prisma.wallet.findUnique({ where: { userId: user.id } }),
    ]);

    const walletBalance = wallet?.balance || 0;
    const pendingEscrow = wallet?.pendingEscrow || 0;
    const rating = pro?.rating || 5.0;
    const verificationStatus = pro?.verificationStatus || "PENDING";

    // Fetch real assigned active bookings
    let activeBookings: any[] = [];
    if (pro) {
      const dbBookings = await prisma.booking.findMany({
        where: {
          professionalId: pro.id,
          status: { in: ["PENDING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "WORK_IN_PROGRESS"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          service: { select: { name: true } },
        },
      });

      activeBookings = dbBookings.map((b) => {
        let addrStr = "Address Provided";
        try {
          if (b.address) {
            const parsed = JSON.parse(b.address);
            if (parsed.address) addrStr = parsed.address;
          }
        } catch {}

        return {
          id: b.reference,
          service: b.service?.name || "Service Dispatch",
          customer: b.customer ? `${b.customer.firstName} ${b.customer.lastName.charAt(0)}.` : "Client",
          address: addrStr,
          price: `₦${b.estimatedPrice.toLocaleString()}`,
          status: b.status,
          date: new Date(b.createdAt).toLocaleDateString(),
        };
      });
    }

    const completedJobs = pro ? await prisma.booking.count({ where: { professionalId: pro.id, status: "COMPLETED" } }) : 0;

    return NextResponse.json({
      success: true,
      proName: `${user.firstName} ${user.lastName}`.trim() || "Artisan Partner",
      verificationStatus,
      walletBalance,
      pendingEscrow,
      completedJobs,
      rating,
      activeJobs: activeBookings,
    });
  } catch (error) {
    console.error("[Pro Dashboard GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch pro dashboard telemetry" }, { status: 500 });
  }
}
