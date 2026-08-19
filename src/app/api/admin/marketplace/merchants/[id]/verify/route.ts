import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, adminId } = body;

    if (!["VERIFIED", "REJECTED", "SUSPENDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid verification status." }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({ where: { id } });
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found." }, { status: 404 });
    }

    const updated = await prisma.merchant.update({
      where: { id },
      data: {
        verificationStatus: status,
        verificationNotes: notes || merchant.verificationNotes,
        verifiedAt: status === "VERIFIED" ? new Date() : merchant.verifiedAt,
      },
    });

    await prisma.marketplaceAuditLog.create({
      data: {
        merchantId: id,
        actorId: adminId || "SYSTEM_ADMIN",
        actorRole: "ADMIN",
        action: `MERCHANT_${status}`,
        details: JSON.stringify({ status, notes, timestamp: new Date().toISOString() }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Merchant verification status updated to ${status}.`,
      merchant: updated,
    });
  } catch (error: any) {
    console.error("[Admin Verify Merchant Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to verify merchant" }, { status: 500 });
  }
}
