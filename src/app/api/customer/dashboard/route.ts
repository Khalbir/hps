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
        user: { firstName: "", lastName: "", email: email || "", phone: "" },
        walletBalance: 0,
        activeDispatchesCount: 0,
        totalBookingsCount: 0,
        bookings: [],
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
        user: { firstName: "", lastName: "", email: email || "", phone: "" },
        walletBalance: 0,
        activeDispatchesCount: 0,
        totalBookingsCount: 0,
        bookings: [],
      });
    }

    const [wallet, dbBookings] = await Promise.all([
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

    const formattedBookings = dbBookings.map((b) => ({
      id: b.reference,
      service: b.service?.name || "Service Dispatch",
      status: b.status,
      date: new Date(b.createdAt).toLocaleDateString() + ", " + new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: `₦${b.estimatedPrice.toLocaleString()}`,
      pro: b.professional?.user ? `${b.professional.user.firstName} ${b.professional.user.lastName.charAt(0)}.` : "Unassigned",
    }));

    const activeDispatchesCount = dbBookings.filter((b) =>
      ["PENDING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "WORK_IN_PROGRESS"].includes(b.status)
    ).length;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName || "Valued Client",
        lastName: user.lastName || "",
        email: user.email,
        phone: user.phone || "Not Provided",
        role: user.role,
      },
      walletBalance: wallet?.balance || 0,
      activeDispatchesCount,
      totalBookingsCount: dbBookings.length,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("[Customer Dashboard GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch customer dashboard data" }, { status: 500 });
  }
}
