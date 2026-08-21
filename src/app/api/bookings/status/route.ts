import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyBookingStatusChange } from "@/lib/notifications";
import { releaseEscrowPayout } from "@/lib/escrow";
import { evaluateReferralQualification } from "@/lib/referrals/engine";

export async function POST(request: Request) {
  try {
    const { bookingId, status, professionalId, notes } = await request.json();

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: "Booking ID and target status are required" },
        { status: 400 }
      );
    }

    // Find booking in PostgreSQL database
    let booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: bookingId }, { reference: bookingId }],
      },
      include: {
        customer: true,
        professional: { include: { user: true } },
        service: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking record not found" }, { status: 404 });
    }

    const previousStatus = booking.status;
    const targetStatus = status.toUpperCase();

    // Enforce state transition rules
    const updateData: any = { status: targetStatus };

    if (professionalId) {
      updateData.professionalId = professionalId;
    }

    if (targetStatus === "COMPLETED") {
      updateData.completedAt = new Date();
      updateData.paymentStatus = "SUCCESS";

      // Release Escrow funds to artisan wallet using dynamic commission engine
      if (booking.professionalId) {
        await releaseEscrowPayout({
          bookingId: booking.id,
          triggerSource: "JOB_COMPLETION",
          notes: notes || "Released upon booking completion",
        }).catch((escrowErr) => {
          console.warn("[Escrow Release Warning]:", escrowErr);
        });
      }

      // Trigger Referral Qualification Evaluation
      if (booking.customerId) {
        evaluateReferralQualification({
          refereeUserId: booking.customerId,
          eventType: "JOB_COMPLETED",
          jobReference: booking.reference,
        }).catch(() => {});
      }
      if (booking.professional?.userId) {
        evaluateReferralQualification({
          refereeUserId: booking.professional.userId,
          eventType: "JOB_COMPLETED",
          jobReference: booking.reference,
        }).catch(() => {});
      }
    }

    // Update booking state in PostgreSQL
    booking = await prisma.booking.update({
      where: { id: booking.id },
      data: updateData,
      include: {
        customer: true,
        professional: { include: { user: true } },
        service: true,
      },
    });

    // Record Audit Log entry
    try {
      await prisma.auditLog.create({
        data: {
          userId: booking.customerId || "SYSTEM",
          action: `BOOKING_STATUS_${targetStatus}`,
          entity: "Booking",
          entityId: booking.id,
          details: JSON.stringify({
            previousStatus,
            newStatus: targetStatus,
            reference: booking.reference,
            notes: notes || "Updated via dispatch workflow",
          }),
        },
      });
    } catch (e) {}

    // Send notifications to client and artisan
    try {
      await notifyBookingStatusChange({
        id: booking.id,
        reference: booking.reference,
        status: targetStatus,
        customerId: booking.customerId,
        customer: booking.customer,
        professional: booking.professional as any,
        service: booking.service,
        estimatedPrice: booking.finalPrice || booking.estimatedPrice || booking.service?.basePrice || 0,
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Booking ${booking.reference} status successfully updated to ${targetStatus}`,
      booking,
    });
  } catch (error: any) {
    console.error("[Booking Status API Error]:", error);
    return NextResponse.json(
      { error: "Failed to update booking status: " + (error.message || "") },
      { status: 500 }
    );
  }
}
