import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    }
    if (!user) {
      user = await prisma.user.findFirst({ where: { role: "PROFESSIONAL" } });
    }

    if (!user) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    // 1. Fetch In-App Notifications from DB
    const dbNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const formattedNotifications = dbNotifications.map((n) => {
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
        jobAction: meta?.["Job Action"] || (n.title.includes("Assigned") ? "ACCEPT_REQUIRED" : "UPDATE"),
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
