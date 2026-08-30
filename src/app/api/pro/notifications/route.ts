import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isArtisanQualifiedForJob, extractTradeSlugsFromText } from "@/lib/trade-categories";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    let user = null;
    if (userId && !userId.startsWith("usr_")) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          professional: {
            include: {
              tradeVerifications: true,
              services: { include: { service: { include: { category: true } } } },
            },
          },
        },
      });
    }

    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          professional: {
            include: {
              tradeVerifications: true,
              services: { include: { service: { include: { category: true } } } },
            },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const proProfile = user.professional;

    // 1. Fetch In-App Notifications from DB for this user
    const dbNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    // Cache bookings for lookup if needed
    const bookingRefsToLookup = new Set<string>();
    for (const n of dbNotifications) {
      let meta: any = null;
      try {
        if (n.data) meta = JSON.parse(n.data);
      } catch {}
      const ref = meta?.["Booking Reference"] || meta?.bookingRef || n.message?.match(/#([A-Za-z0-9-_]+)/)?.[1];
      if (ref) {
        bookingRefsToLookup.add(ref.replace(/^#/, ""));
      }
    }

    const bookingsMap = new Map<string, any>();
    if (bookingRefsToLookup.size > 0) {
      const foundBookings = await prisma.booking.findMany({
        where: { reference: { in: Array.from(bookingRefsToLookup) } },
        include: { service: { include: { category: true } } },
      });
      for (const b of foundBookings) {
        bookingsMap.set(b.reference, b);
      }
    }

    // 2. Strict Pro Filter: Filter out non-pro notifications and trade-mismatched jobs
    const filteredNotifications = dbNotifications.filter((n) => {
      let meta: any = null;
      try {
        if (n.data) meta = JSON.parse(n.data);
      } catch {}

      // A. Filter out Client-Side Payment Confirmations (e.g. "Your payment of ₦... was confirmed")
      if (n.type === "PAYMENT" && (n.title.includes("Payment Confirmed") || n.message.includes("Your payment of"))) {
        return false;
      }

      // B. If it's a BOOKING notification, check trade category & skillset qualification
      if (n.type === "BOOKING") {
        // If it's a client booking confirmation message, filter it out
        if (n.message.includes("Our location intelligence engine is dispatching") || n.message.includes("Your booking #")) {
          if (!n.title.includes("Artisan") && !n.title.includes("Job") && !n.title.includes("Assigned")) {
            return false;
          }
        }

        // If proProfile exists, gate strictly by trade & skillset
        if (proProfile) {
          const ref = (meta?.["Booking Reference"] || meta?.bookingRef || n.message?.match(/#([A-Za-z0-9-_]+)/)?.[1] || "").replace(/^#/, "");
          const bookingObj = ref ? bookingsMap.get(ref) : null;

          const serviceName = meta?.Service || bookingObj?.service?.name || meta?.serviceName || null;
          const serviceCategory = bookingObj?.service?.category?.slug || bookingObj?.service?.category?.name || meta?.serviceCategory || null;
          const tradeCategories = meta?.tradeCategories || null;

          const isQualified = isArtisanQualifiedForJob(proProfile, {
            serviceName,
            serviceCategory,
            tradeCategories,
            service: bookingObj?.service,
            title: n.title,
            message: n.message,
          });

          if (!isQualified) {
            // Unqualified trade / skillset: Suppress notification from artisan feed
            return false;
          }
        }
      }

      return true;
    });

    const formattedNotifications = filteredNotifications.map((n) => {
      let meta: any = null;
      try {
        if (n.data) meta = JSON.parse(n.data);
      } catch {}

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
        metadata: meta,
        bookingRef: meta?.["Booking Reference"] || meta?.bookingRef || null,
        jobAction: meta?.["Job Action"] || (n.title.includes("Assigned") || n.title.includes("Available") ? "ACCEPT_REQUIRED" : "UPDATE"),
      };
    });

    const unreadCount = formattedNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("[Pro Notifications GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to load notifications: " + (error.message || "") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, notificationId, userId } = body;

    if (action === "MARK_ALL_READ" && userId) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (action === "MARK_READ" && notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "Invalid notification action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Pro Notifications POST Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notification status" },
      { status: 500 }
    );
  }
}
