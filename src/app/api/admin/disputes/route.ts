import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processBookingRefund } from "@/lib/fintech";
import { sendMultiChannelNotification, formatNaira } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const disputes = await prisma.dispute.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            service: { select: { name: true } },
          },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        professional: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        assignedTo: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, disputes });
  } catch (error) {
    console.error("[Disputes GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, disputeId, bookingId, customerId, professionalId, reason, description, evidencePhotos, resolutionStatus, refundAmount, resolutionNotes, adminUserId } = body;

    // Create New Dispute Action
    if (action === "CREATE") {
      if (!bookingId || !customerId || !reason || !description) {
        return NextResponse.json({ error: "Missing required dispute fields" }, { status: 400 });
      }

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const proId = professionalId || booking.professionalId || "";

      const dispute = await prisma.dispute.create({
        data: {
          reference: `DISP_${booking.reference}_${Date.now()}`,
          bookingId,
          customerId,
          professionalId: proId,
          reason,
          description,
          evidencePhotos: evidencePhotos ? JSON.stringify(evidencePhotos) : "[]",
          status: "OPEN",
        },
      });

      return NextResponse.json({ success: true, dispute, message: "Dispute ticket submitted successfully" });
    }

    // Resolve Dispute Action (Optionally Trigger Refund)
    if (action === "RESOLVE") {
      if (!disputeId || !resolutionStatus) {
        return NextResponse.json({ error: "Dispute ID and resolutionStatus required" }, { status: 400 });
      }

      const existing = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: { customer: true, booking: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Dispute ticket not found" }, { status: 404 });
      }

      let updatedRefund = Number(refundAmount || 0);

      // Trigger automatic refund process if status is RESOLVED_REFUNDED or RESOLVED_PARTIAL_REFUND
      if (resolutionStatus === "RESOLVED_REFUNDED" || resolutionStatus === "RESOLVED_PARTIAL_REFUND") {
        if (!updatedRefund || updatedRefund <= 0) {
          updatedRefund = existing.booking.estimatedPrice;
        }

        await processBookingRefund({
          bookingId: existing.bookingId,
          amountNgn: updatedRefund,
          reason: resolutionNotes || `Dispute Resolution: ${resolutionStatus}`,
          adminUserId: adminUserId || "SYSTEM_ADMIN",
        });
      }

      const updatedDispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: resolutionStatus,
          refundAmount: updatedRefund,
          resolutionNotes: resolutionNotes || undefined,
          resolvedAt: new Date(),
          assignedToId: adminUserId || undefined,
        },
      });

      // Send resolution notification
      await sendMultiChannelNotification({
        userId: existing.customerId,
        recipientEmail: existing.customer.email,
        recipientPhone: existing.customer.phone || undefined,
        recipientName: `${existing.customer.firstName} ${existing.customer.lastName}`,
        type: "DISPUTE",
        title: `Dispute Case Updated: ${resolutionStatus}`,
        message: `Your complaint for booking #${existing.booking.reference} has been resolved (${resolutionStatus}). ${resolutionNotes ? "Notes: " + resolutionNotes : ""}`,
        metadata: {
          "Dispute Ref": existing.reference,
          Status: resolutionStatus,
          "Refund Amount": updatedRefund > 0 ? formatNaira(updatedRefund) : "None",
        },
      });

      return NextResponse.json({ success: true, dispute: updatedDispute, message: "Dispute resolved successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Disputes POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to process dispute request" }, { status: 500 });
  }
}
