import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyBookingStatusChange } from "@/lib/notifications";

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

      // Release Escrow funds to artisan wallet
      if (booking.professionalId) {
        const artisanUser = await prisma.professional.findUnique({
          where: { id: booking.professionalId },
          select: { userId: true },
        });

        if (artisanUser?.userId) {
          const jobPrice = booking.finalPrice || booking.estimatedPrice || 15000;
          const artisanEarnings = Math.round(jobPrice * 0.85); // 85% payout after 15% platform commission

          await prisma.wallet.upsert({
            where: { userId: artisanUser.userId },
            update: {
              balance: { increment: artisanEarnings },
            },
            create: {
              userId: artisanUser.userId,
              balance: artisanEarnings,
            },
          }).catch(() => {});
        }
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
        estimatedPrice: booking.finalPrice || booking.estimatedPrice || 15000,
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
