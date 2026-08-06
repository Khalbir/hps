import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    let user: any = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    }

    // Default fallback user resolution
    if (!user) {
      user = await prisma.user.findFirst({ where: { role: "PROFESSIONAL" } });
    }

    const proName = user ? `${user.firstName} ${user.lastName}`.trim() : "Artisan Partner";
    const targetUserId = user?.id;

    let pro = null;
    let wallet = null;

    if (targetUserId) {
      [pro, wallet] = await Promise.all([
        prisma.professional.findUnique({ where: { userId: targetUserId } }),
        prisma.wallet.findUnique({ where: { userId: targetUserId } }),
      ]);
    }

    const walletBalance = wallet?.balance || 0;
    const pendingEscrow = wallet?.pendingEscrow || 0;
    const rating = pro?.rating || 5.0;
    const completedJobs = pro?.totalJobs || 0;

    let hasSubmittedDocs = false;
    try {
      if (pro?.documents && pro.documents.length > 5) {
        hasSubmittedDocs = true;
      }
    } catch {}

    let calculatedStatus = "UNVERIFIED";
    if (pro?.verificationStatus === "VERIFIED") {
      calculatedStatus = "VERIFIED";
    } else if (pro?.verificationStatus === "REJECTED") {
      calculatedStatus = "REJECTED";
    } else if (pro?.verificationStatus === "PENDING" && hasSubmittedDocs) {
      calculatedStatus = "PENDING_REVIEW";
    } else {
      calculatedStatus = "UNVERIFIED";
    }

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
        } catch {
          if (b.address) addrStr = b.address;
        }

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

    return NextResponse.json({
      success: true,
      proName,
      userEmail: user?.email || "",
      verificationStatus: calculatedStatus, // VERIFIED | PENDING_REVIEW | REJECTED | UNVERIFIED
      hasSubmittedDocs,
      verificationNotes: pro?.verificationNotes || "",
      walletBalance,
      pendingEscrow,
      completedJobs,
      rating,
      activeJobs: activeBookings,
    });
  } catch (error: any) {
    console.error("[Pro Dashboard API Error]:", error);
    return NextResponse.json({
      success: true,
      proName: "Artisan Partner",
      verificationStatus: "UNVERIFIED",
      hasSubmittedDocs: false,
      walletBalance: 0,
      pendingEscrow: 0,
      completedJobs: 0,
      rating: 5.0,
      activeJobs: [],
    });
  }
}
