import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/pro/availability?userId=...&email=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    let user: any = null;
    if (userId && !userId.startsWith("pro-user")) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    }
    if (!user) {
      user = await prisma.user.findFirst({ where: { role: "PROFESSIONAL" } });
    }

    if (!user) {
      return NextResponse.json({ success: true, isAvailable: true, status: "ONLINE" });
    }

    const pro = await prisma.professional.findUnique({
      where: { userId: user.id },
      select: { id: true, isAvailable: true, verificationStatus: true, latitude: true, longitude: true },
    });

    const isAvailable = pro ? Boolean(pro.isAvailable) : true;

    return NextResponse.json({
      success: true,
      userId: user.id,
      proId: pro?.id,
      isAvailable,
      status: isAvailable ? "ONLINE" : "OFFLINE",
      verificationStatus: pro?.verificationStatus || "PENDING",
    });
  } catch (error: any) {
    console.error("[Pro Availability GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch availability status" }, { status: 500 });
  }
}

// POST or PUT /api/pro/availability
// Body: { userId?, email?, proId?, isAvailable: boolean, latitude?, longitude? }
export async function POST(request: Request) {
  return handleAvailabilityUpdate(request);
}

export async function PUT(request: Request) {
  return handleAvailabilityUpdate(request);
}

async function handleAvailabilityUpdate(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, proId, isAvailable, latitude, longitude } = body;

    let user: any = null;
    if (userId && !userId.startsWith("pro-user")) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    }
    if (!user && proId) {
      const pro = await prisma.professional.findUnique({ where: { id: proId }, include: { user: true } });
      if (pro?.user) user = pro.user;
    }
    if (!user) {
      user = await prisma.user.findFirst({ where: { role: "PROFESSIONAL" } });
    }

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const targetIsAvailable = Boolean(isAvailable);

    // Find or create professional record
    let pro = await prisma.professional.findUnique({
      where: { userId: user.id },
    });

    const updateData: any = {
      isAvailable: targetIsAvailable,
    };
    if (typeof latitude === "number") updateData.latitude = latitude;
    if (typeof longitude === "number") updateData.longitude = longitude;

    if (pro) {
      pro = await prisma.professional.update({
        where: { id: pro.id },
        data: updateData,
      });
    } else {
      pro = await prisma.professional.create({
        data: {
          userId: user.id,
          verificationStatus: user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? "VERIFIED" : "PENDING",
          digitalId: `HHP-PRO-${user.id.slice(-5).toUpperCase()}`,
          isAvailable: targetIsAvailable,
          rating: 4.5,
          latitude: latitude || 9.0765,
          longitude: longitude || 7.4723,
          skills: JSON.stringify(["General Maintenance"]),
          documents: "{}",
        },
      });
    }

    // Record audit log for admin visibility
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: targetIsAvailable ? "ARTISAN_ONLINE_ACTIVATED" : "ARTISAN_OFFLINE_DEACTIVATED",
          entity: "Professional",
          entityId: pro.id,
          details: JSON.stringify({
            artisanName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            isAvailable: targetIsAvailable,
            status: targetIsAvailable ? "ONLINE" : "OFFLINE",
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      isAvailable: targetIsAvailable,
      status: targetIsAvailable ? "ONLINE" : "OFFLINE",
      message: targetIsAvailable ? "Status updated to Online & Ready for Jobs! 🟢" : "Status updated to Offline ⚪",
      pro,
    });
  } catch (error: any) {
    console.error("[Pro Availability Update Error]:", error);
    return NextResponse.json({ error: "Failed to update availability status" }, { status: 500 });
  }
}
