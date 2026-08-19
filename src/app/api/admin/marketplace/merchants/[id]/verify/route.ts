import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, adminId, isGpsVerified, storefrontVerified, serviceZoneId, latitude, longitude } = body;

    if (status && !["VERIFIED", "REJECTED", "SUSPENDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid verification status." }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({ where: { id } });
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found." }, { status: 404 });
    }

    const targetStatus = status || merchant.verificationStatus;
    const isGps = isGpsVerified !== undefined ? Boolean(isGpsVerified) : merchant.isGpsVerified;

    const updated = await prisma.merchant.update({
      where: { id },
      data: {
        verificationStatus: targetStatus,
        verificationNotes: notes || merchant.verificationNotes,
        verifiedAt: targetStatus === "VERIFIED" ? new Date() : merchant.verifiedAt,
        isGpsVerified: isGps,
        gpsVerifiedAt: isGps ? new Date() : merchant.gpsVerifiedAt,
        storefrontVerified: storefrontVerified !== undefined ? Boolean(storefrontVerified) : merchant.storefrontVerified,
        serviceZoneId: serviceZoneId || merchant.serviceZoneId,
        latitude: latitude ? parseFloat(latitude) : merchant.latitude,
        longitude: longitude ? parseFloat(longitude) : merchant.longitude,
      },
    });

    await prisma.marketplaceAuditLog.create({
      data: {
        merchantId: id,
        actorId: adminId || "SYSTEM_ADMIN",
        actorRole: "ADMIN",
        action: `MERCHANT_VERIFY_UPDATE`,
        details: JSON.stringify({ status: targetStatus, isGpsVerified: isGps, notes, timestamp: new Date().toISOString() }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Merchant verification details updated successfully.`,
      merchant: updated,
    });
  } catch (error: any) {
    console.error("[Admin Verify Merchant Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to verify merchant" }, { status: 500 });
  }
}
