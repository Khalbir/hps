import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, decision, notes, adminId } = body;
    // decision: "APPROVE" | "REJECT" | "SUSPEND" | "APPROVE_CHANGE" | "REJECT_CHANGE"

    if (!userId || !decision) {
      return NextResponse.json(
        { error: "Target userId and decision are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    let updateData: any = {};
    let notificationTitle = "";
    let notificationMessage = "";
    let auditAction = "";

    if (decision === "MANUAL_SET" || body.permanentAddress) {
      const targetAddress = body.permanentAddress || user.permanentAddress || "Plot 104, Aminu Kano Crescent, Wuse 2, Abuja";
      const targetProof = body.permanentAddressProof || user.permanentAddressProof || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200";
      const targetStatus = body.status || "VERIFIED";

      updateData = {
        permanentAddress: targetAddress,
        permanentAddressProof: targetProof,
        permanentAddressStatus: targetStatus,
        isVerified: targetStatus === "VERIFIED",
        permanentAddressNotes: notes || "Address manually registered and verified by HandyHub Admin.",
      };
      notificationTitle = targetStatus === "VERIFIED" ? "Permanent Address Verified! 🎉" : "Address Record Updated";
      notificationMessage = `Your permanent home address (${targetAddress}) was updated and verified by HandyHub Admin.`;
      auditAction = "MANUAL_SET_ADDRESS";
    } else if (decision === "APPROVE") {
      updateData = {
        permanentAddressStatus: "VERIFIED",
        isVerified: true,
        permanentAddressNotes: notes || "Address proof audited and verified by HandyHub Compliance.",
      };
      notificationTitle = "Permanent Address Verified! 🎉";
      notificationMessage = `Your permanent home address (${user.permanentAddress}) has been audited and officially verified by HandyHub Compliance. All services unlocked!`;
      auditAction = "APPROVE_ADDRESS";
    } else if (decision === "APPROVE_CHANGE") {
      if (!user.pendingPermanentAddress) {
        return NextResponse.json(
          { error: "No pending address change request found for this user." },
          { status: 400 }
        );
      }
      const newAddress = user.pendingPermanentAddress;
      const newProof = user.pendingPermanentAddressProof || user.permanentAddressProof;

      updateData = {
        permanentAddress: newAddress,
        permanentAddressProof: newProof,
        pendingPermanentAddress: null,
        pendingPermanentAddressProof: null,
        permanentAddressStatus: "VERIFIED",
        isVerified: true,
        permanentAddressNotes: notes || "Address change request approved by HandyHub Compliance.",
      };
      notificationTitle = "Address Change Approved! 🏡";
      notificationMessage = `Your request to update your permanent address to (${newAddress}) has been approved by HandyHub Compliance.`;
      auditAction = "APPROVE_ADDRESS_CHANGE";
    } else if (decision === "REJECT_CHANGE") {
      updateData = {
        pendingPermanentAddress: null,
        pendingPermanentAddressProof: null,
        permanentAddressNotes: `Address change request declined: ${notes || "Submitted document was incomplete or invalid."}`,
      };
      notificationTitle = "Address Change Request Declined ⚠️";
      notificationMessage = `Your request to change your permanent address was declined by compliance. Reason: ${notes || "Document invalid."}`;
      auditAction = "REJECT_ADDRESS_CHANGE";
    } else if (decision === "REJECT") {
      updateData = {
        permanentAddressStatus: "REJECTED",
        permanentAddressNotes: notes || "Proof document rejected. Please upload a clear utility bill or tenancy agreement.",
      };
      notificationTitle = "Address Verification Action Required ⚠️";
      notificationMessage = `Your address proof document was rejected. Reason: ${notes || "Incomplete document"}. Please re-upload in your dashboard.`;
      auditAction = "REJECT_ADDRESS";
    } else if (decision === "SUSPEND") {
      updateData = {
        permanentAddressStatus: "SUSPENDED",
        permanentAddressNotes: notes || "Address status suspended pending further security investigation.",
      };
      notificationTitle = "Address Status Suspended 🔴";
      notificationMessage = `Your verified address status has been suspended. Reason: ${notes || "Compliance review"}. Please contact support.`;
      auditAction = "SUSPEND_ADDRESS";
    } else {
      return NextResponse.json({ error: "Invalid audit decision action." }, { status: 400 });
    }

    // Execute User update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Immutable Audit Log entry
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId || "admin_system",
          action: auditAction,
          entity: "USER",
          entityId: userId,
          details: JSON.stringify({
            targetUserId: userId,
            targetEmail: user.email,
            decision,
            notes: notes || "",
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      console.warn("[Admin Address Verification AuditLog Error]:", auditErr);
    }

    // System Notification to User
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: "VERIFICATION",
          title: notificationTitle,
          message: notificationMessage,
        },
      });
    } catch (notifErr) {
      console.warn("[Admin Address Verification Notification Error]:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `User address verification status successfully updated (${decision}).`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        permanentAddressStatus: updatedUser.permanentAddressStatus,
        permanentAddress: updatedUser.permanentAddress,
      },
    });
  } catch (error: any) {
    console.error("[Admin Address Verification POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to update address verification status" },
      { status: 500 }
    );
  }
}
