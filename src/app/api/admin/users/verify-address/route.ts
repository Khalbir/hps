import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const userDataStr = cookieStore.get("handyhub_user_data")?.value;
    if (userDataStr) {
      return JSON.parse(userDataStr);
    }
  } catch (e) {
    console.warn("Failed to get requesting user from cookies:", e);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const requester = await getRequestingUser();
    if (!requester || (requester.role !== "SUPER_ADMIN" && requester.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied. Administrative privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { userId, decision, notes } = body;

    if (!userId || !decision) {
      return NextResponse.json({ error: "User ID and Decision are required" }, { status: 400 });
    }

    const client = await prisma.user.findUnique({ where: { id: userId } });
    if (!client) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 });
    }

    const isApprove = decision === "APPROVE";
    const status = isApprove ? "VERIFIED" : "REJECTED";
    const notesText = notes && notes.trim() ? notes.trim() : (isApprove ? "Address verified successfully." : "Rejection notes not specified.");

    await prisma.user.update({
      where: { id: userId },
      data: {
        permanentAddressStatus: status,
        permanentAddressNotes: notesText,
      },
    });

    // Create Notification for the client
    await prisma.notification.create({
      data: {
        userId: userId,
        type: "SYSTEM",
        title: isApprove ? "Address Verification Approved ✅" : "Address Verification Rejected ❌",
        message: isApprove
          ? `Your permanent home address (${client.permanentAddress}) has been verified. You can now add a secondary address for bookings.`
          : `Your permanent home address verification was rejected. Reason: ${notesText}`,
      },
    }).catch(() => {});

    // Log the audit event
    await prisma.auditLog.create({
      data: {
        userId: requester.id,
        action: isApprove ? "VERIFY_CLIENT_ADDRESS" : "REJECT_CLIENT_ADDRESS",
        entity: "User",
        entityId: userId,
        details: JSON.stringify({ email: client.email, notes: notesText }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Client address successfully ${isApprove ? "verified" : "rejected"}!`,
    });
  } catch (error) {
    console.error("[Verify Client Address API Error]:", error);
    return NextResponse.json({ error: "Failed to update address verification state" }, { status: 500 });
  }
}
