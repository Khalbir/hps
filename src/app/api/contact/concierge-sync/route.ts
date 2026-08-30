import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendConciergeCommunicationSyncAlert } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      bookingRef,
      bookingId,
      clientName = "Valued Client",
      clientPhone = "+234 812 222 2936",
      artisanName = "Assigned Professional",
      artisanPhone = "+234 812 222 2936",
      serviceName = "Home Service",
      messageCopy = "",
      channel = "WHATSAPP",
      isUrgent = false,
    } = body;

    const ref = bookingRef || bookingId || "HHP-SERVICE";

    // 1. Fetch related Booking & User if available
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { reference: ref },
          { id: ref },
        ],
      },
      include: {
        customer: true,
        service: true,
        professional: {
          include: { user: true },
        },
      },
    });

    const finalClientName = booking?.customer ? `${booking.customer.firstName} ${booking.customer.lastName}`.trim() : clientName;
    const finalClientPhone = booking?.customer?.phone || clientPhone;
    const finalArtisanName = booking?.professional?.user ? `${booking.professional.user.firstName} ${booking.professional.user.lastName}`.trim() : artisanName;
    const finalArtisanPhone = booking?.professional?.user?.phone || artisanPhone;
    const finalServiceName = booking?.service?.name || serviceName;

    // 2. Record immutable AuditLog entry for dispute mediation & SLA monitoring
    try {
      await prisma.auditLog.create({
        data: {
          userId: booking?.customerId || null,
          action: isUrgent ? "CLIENT_CONCIERGE_URGENT_DISPUTE_INTERVENTION" : "CLIENT_ARTISAN_CONTACT_DISPATCH_SYNC",
          entity: "Booking",
          entityId: booking?.id || ref,
          details: JSON.stringify({
            bookingRef: ref,
            channel,
            clientName: finalClientName,
            clientPhone: finalClientPhone,
            artisanName: finalArtisanName,
            artisanPhone: finalArtisanPhone,
            serviceName: finalServiceName,
            messageCopy,
            isUrgent,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      console.warn("[Concierge Sync] Audit log write warning:", auditErr);
    }

    // 3. Dispatch Notification to Admin & Dispute Officers
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT", "OPERATIONS_MANAGER"] },
        },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await prisma.notification.createMany({
          data: adminUsers.map((admin) => ({
            userId: admin.id,
            type: "DISPUTE",
            title: isUrgent
              ? `🚨 URGENT Dispute Intervention Request: #${ref}`
              : `💬 Client-Artisan Dispatch Sync: #${ref} (${finalArtisanName})`,
            message: `Client ${finalClientName} initiated ${channel} communication with Artisan ${finalArtisanName} for ${finalServiceName}. Transcript: "${messageCopy.substring(0, 120)}..."`,
            data: JSON.stringify({
              bookingRef: ref,
              bookingId: booking?.id || ref,
              channel,
              clientPhone: finalClientPhone,
              artisanPhone: finalArtisanPhone,
              isUrgent,
            }),
          })),
        });
      }
    } catch (notifErr) {
      console.warn("[Concierge Sync] Notification write warning:", notifErr);
    }

    // 4. Dispatch copy via WhatsApp Alert Engine to HandyHub Support Concierge Desk
    try {
      await sendConciergeCommunicationSyncAlert({
        bookingRef: ref,
        clientName: finalClientName,
        clientPhone: finalClientPhone,
        artisanName: finalArtisanName,
        artisanPhone: finalArtisanPhone,
        serviceName: finalServiceName,
        channel,
        messageCopy,
        isUrgent,
      });
    } catch (waErr) {
      console.warn("[Concierge Sync] WhatsApp dispatch warning:", waErr);
    }

    return NextResponse.json({
      success: true,
      message: "Communication transcript logged with HandyHub Concierge Desk for early dispute intervention.",
      bookingRef: ref,
      channel,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Concierge Sync Error]:", error);
    return NextResponse.json(
      { error: "Failed to sync communication log with concierge desk: " + (error?.message || "") },
      { status: 500 }
    );
  }
}
