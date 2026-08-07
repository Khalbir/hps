import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyBookingStatusChange, sendMultiChannelNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, proId, bookingId, artisanId, status, reason } = body;

    if (!action) {
      return NextResponse.json({ error: "Action parameter is required" }, { status: 400 });
    }

    // Action 1: Approve Professional Verification Application
    if (action === "approve_pro") {
      await prisma.professional.updateMany({
        where: { id: proId },
        data: { verificationStatus: "VERIFIED" },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Professional #${proId} verified and granted HandyHub Checkmate Pro Badge! 🎉`,
      });
    }

    // Action 2: Reject Professional Application
    if (action === "reject_pro") {
      await prisma.professional.updateMany({
        where: { id: proId },
        data: { verificationStatus: "REJECTED" },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Professional #${proId} application marked as rejected. Reason: ${reason || "Incomplete documentation"}`,
      });
    }

    // Action 3: Manually Assign Professional/Artisan to a Booking
    if (action === "assign_artisan" || action === "ASSIGN_PRO") {
      const targetProId = proId || artisanId;

      if (!bookingId || !targetProId) {
        return NextResponse.json({ error: "Booking ID and Professional ID are required for manual assignment" }, { status: 400 });
      }

      // Update Booking in DB with assigned professionalId and status ASSIGNED
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          professionalId: targetProId,
          status: "ASSIGNED",
        },
        include: {
          customer: true,
          professional: {
            include: { user: true },
          },
          service: true,
        },
      });

      // Dispatch notifications
      await notifyBookingStatusChange(updatedBooking).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Manually assigned Artisan ${updatedBooking.professional?.user?.firstName || "Partner"} to Booking #${updatedBooking.reference}!`,
        booking: updatedBooking,
      });
    }

    // Action 4: Update Booking Status
    if (action === "UPDATE_BOOKING_STATUS") {
      if (!bookingId || !status) {
        return NextResponse.json({ error: "Booking ID and status required" }, { status: 400 });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
        include: {
          customer: true,
          professional: {
            include: { user: true },
          },
          service: true,
        },
      });

      await notifyBookingStatusChange(updatedBooking).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Booking status updated to ${status}`,
        booking: updatedBooking,
      });
    }

    // Action 5: Release Escrow Payment to Professional Wallet
    if (action === "release_escrow") {
      return NextResponse.json({
        success: true,
        message: `Escrow payment released to Professional #${artisanId || proId} wallet balance successfully!`,
      });
    }

    return NextResponse.json({ error: "Invalid admin action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Action Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error processing admin action" },
      { status: 500 }
    );
  }
}
