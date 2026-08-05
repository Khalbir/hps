import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMultiChannelNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") where.verificationStatus = status;

    const professionals = await prisma.professional.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    return NextResponse.json({ success: true, professionals });
  } catch (error) {
    console.error("[Verification GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch professionals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      professionalId,
      status, // VERIFIED, REJECTED, PENDING
      idType,
      idNumber,
      idUrl,
      addressProofUrl,
      bvn,
      addressVerified,
      verificationNotes,
      adminUserId,
    } = body;

    if (!professionalId) {
      return NextResponse.json({ error: "Professional ID is required" }, { status: 400 });
    }

    const pro = await prisma.professional.findUnique({
      where: { id: professionalId },
      include: { user: true },
    });

    if (!pro) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 });
    }

    const updated = await prisma.professional.update({
      where: { id: professionalId },
      data: {
        verificationStatus: status || pro.verificationStatus,
        idType: idType !== undefined ? idType : pro.idType,
        idNumber: idNumber !== undefined ? idNumber : pro.idNumber,
        idUrl: idUrl !== undefined ? idUrl : pro.idUrl,
        addressProofUrl: addressProofUrl !== undefined ? addressProofUrl : pro.addressProofUrl,
        bvn: bvn !== undefined ? bvn : pro.bvn,
        addressVerified: addressVerified !== undefined ? Boolean(addressVerified) : pro.addressVerified,
        verificationNotes: verificationNotes !== undefined ? verificationNotes : pro.verificationNotes,
        verifiedBy: adminUserId || undefined,
        verifiedAt: status === "VERIFIED" ? new Date() : pro.verifiedAt,
      },
    });

    if (status === "VERIFIED") {
      await prisma.user.update({
        where: { id: pro.userId },
        data: { isVerified: true },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: adminUserId || "SYSTEM_ADMIN",
        action: `ARTISAN_VERIFICATION_${status}`,
        entity: "Professional",
        entityId: professionalId,
        details: JSON.stringify({
          status,
          idType,
          addressVerified,
          verificationNotes,
        }),
      },
    });

    const statusText = status === "VERIFIED" ? "Approved & Verified" : status === "REJECTED" ? "Rejected" : "Pending Review";
    await sendMultiChannelNotification({
      userId: pro.userId,
      recipientEmail: pro.user.email,
      recipientPhone: pro.user.phone || undefined,
      recipientName: `${pro.user.firstName} ${pro.user.lastName}`,
      type: "VERIFICATION",
      title: `Identity Verification Status: ${statusText}`,
      message:
        status === "VERIFIED"
          ? "Congratulations! Your ID & address verification documents have been approved. You are now a Verified HandyHub Artisan."
          : `Your verification status has been updated to: ${statusText}. ${verificationNotes ? "Notes: " + verificationNotes : ""}`,
      metadata: {
        "Pro Partner ID": pro.id,
        "Verification Status": statusText,
        "Govt ID Type": idType || pro.idType || "Submitted",
      },
    });

    return NextResponse.json({
      success: true,
      professional: updated,
      message: `Artisan verification status updated to ${status}`,
    });
  } catch (error: any) {
    console.error("[Verification API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update verification status" }, { status: 500 });
  }
}
