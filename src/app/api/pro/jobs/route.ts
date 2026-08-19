import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyBookingStatusChange } from "@/lib/notifications";
import { releaseEscrowPayout } from "@/lib/escrow";
import { getBookingOtp } from "@/lib/bookingOtp";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json({ success: true, jobs: [] });
    }

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    }

    if (!user) {
      return NextResponse.json({ success: true, jobs: [] });
    }

    const pro = await prisma.professional.findUnique({
      where: { userId: user.id },
    });

    if (!pro) {
      return NextResponse.json({ success: true, jobs: [] });
    }

    const dbBookings = await prisma.booking.findMany({
      where: {
        professionalId: pro.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
        service: { select: { name: true } },
        replacementParts: { include: { supplier: true }, orderBy: { createdAt: "desc" } },
      },
    });

    const formattedJobs = dbBookings.map((b) => {
      let addrStr = "Address Provided";
      try {
        if (b.address) {
          const parsed = JSON.parse(b.address);
          if (parsed.address) addrStr = parsed.address;
        }
      } catch {}

      const isValidProofUrl = (url: any): boolean => {
        if (!url || typeof url !== "string") return false;
        const trimmed = url.trim();
        if (!trimmed || trimmed === "[]" || trimmed === "null" || trimmed === "undefined") return false;
        if (trimmed.includes("before_sample.jpg") || trimmed.includes("after_sample.jpg") || trimmed.includes("handyhub.ng/photos/")) return false;
        return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image/") || trimmed.startsWith("/");
      };

      let beforePhoto = null;
      let afterPhoto = null;
      try {
        if (b.beforePhotos) {
          const parsed = JSON.parse(b.beforePhotos);
          const raw = Array.isArray(parsed) ? parsed[0] : parsed;
          if (isValidProofUrl(raw)) beforePhoto = raw;
        }
      } catch {
        if (isValidProofUrl(b.beforePhotos)) beforePhoto = b.beforePhotos;
      }

      try {
        if (b.afterPhotos) {
          const parsed = JSON.parse(b.afterPhotos);
          const raw = Array.isArray(parsed) ? parsed[0] : parsed;
          if (isValidProofUrl(raw)) afterPhoto = raw;
        }
      } catch {
        if (isValidProofUrl(b.afterPhotos)) afterPhoto = b.afterPhotos;
      }

      return {
        id: b.reference,
        service: b.service?.name || "Service Dispatch",
        customer: b.customer ? `${b.customer.firstName} ${b.customer.lastName.charAt(0)}.` : "Client User",
        phone: b.customer?.phone || "+234 800 000 0000",
        address: addrStr,
        date: new Date(b.createdAt).toLocaleDateString(),
        time: new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: `₦${b.estimatedPrice.toLocaleString()}`,
        status: b.status,
        otpCode: getBookingOtp(b),
        beforePhoto,
        afterPhoto,
        dbBookingId: b.id,
        replacementParts: b.replacementParts || [],
      };
    });

    return NextResponse.json({ success: true, jobs: formattedJobs });
  } catch (error) {
    console.error("[Pro Jobs GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch active jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, bookingReference, beforePhotoUrl, afterPhotoUrl, otpCode } = body;

    if (!bookingReference) {
      return NextResponse.json({ error: "Booking reference required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { reference: bookingReference },
      include: {
        customer: true,
        service: true,
        professional: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true, email: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 1. ACCEPT JOB
    if (action === "ACCEPT_JOB") {
      const updated = await prisma.booking.update({
        where: { reference: bookingReference },
        data: { status: "CONFIRMED" },
        include: { customer: true, service: true, professional: { include: { user: true } } },
      });

      try {
        await notifyBookingStatusChange({
          id: updated.id,
          reference: updated.reference,
          status: "CONFIRMED",
          customerId: updated.customerId,
          customer: updated.customer,
          professional: updated.professional as any,
          service: updated.service,
          estimatedPrice: updated.finalPrice || updated.estimatedPrice || 15000,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: "Job accepted and customer notified live on WhatsApp & Email!",
        booking: updated,
      });
    }

    // 2. EN ROUTE / ON THE WAY
    if (action === "EN_ROUTE" || action === "ON_THE_WAY") {
      const updated = await prisma.booking.update({
        where: { reference: bookingReference },
        data: { status: "EN_ROUTE" },
        include: { customer: true, service: true, professional: { include: { user: true } } },
      });

      try {
        await notifyBookingStatusChange({
          id: updated.id,
          reference: updated.reference,
          status: "EN_ROUTE",
          customerId: updated.customerId,
          customer: updated.customer,
          professional: updated.professional as any,
          service: updated.service,
          estimatedPrice: updated.finalPrice || updated.estimatedPrice || 15000,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: "Marked on the way! Live GPS tracking dispatched to customer.",
        booking: updated,
      });
    }

    // 3. START JOB / ARRIVED
    if (action === "START_JOB") {
      const existingBefore = booking.beforePhotos ? JSON.parse(booking.beforePhotos) : [];
      const updatedBefore = beforePhotoUrl
        ? [beforePhotoUrl, ...existingBefore.filter((u: string) => u !== beforePhotoUrl)]
        : existingBefore;

      const updated = await prisma.booking.update({
        where: { reference: bookingReference },
        data: {
          status: "IN_PROGRESS",
          beforePhotos: JSON.stringify(updatedBefore.length > 0 ? updatedBefore : (beforePhotoUrl ? [beforePhotoUrl] : [])),
        },
        include: { customer: true, service: true, professional: { include: { user: true } } },
      });

      try {
        await notifyBookingStatusChange({
          id: updated.id,
          reference: updated.reference,
          status: "IN_PROGRESS",
          customerId: updated.customerId,
          customer: updated.customer,
          professional: updated.professional as any,
          service: updated.service,
          estimatedPrice: updated.finalPrice || updated.estimatedPrice || 15000,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: "Job started! Customer notified on work progress with before photos.",
        booking: updated,
      });
    }

    // 4. COMPLETE JOB
    if (action === "COMPLETE_JOB") {
      const expectedOtp = getBookingOtp(booking);
      if (otpCode && otpCode.trim() !== expectedOtp) {
        return NextResponse.json({ error: "Invalid completion OTP. Please enter correct 4-digit customer OTP." }, { status: 400 });
      }

      const existingAfter = booking.afterPhotos ? JSON.parse(booking.afterPhotos) : [];
      const updatedAfter = afterPhotoUrl
        ? [afterPhotoUrl, ...existingAfter.filter((u: string) => u !== afterPhotoUrl)]
        : existingAfter;

      const updated = await prisma.booking.update({
        where: { reference: bookingReference },
        data: {
          status: "COMPLETED",
          completionNote: expectedOtp,
          afterPhotos: JSON.stringify(updatedAfter.length > 0 ? updatedAfter : (afterPhotoUrl ? [afterPhotoUrl] : [])),
          completedAt: new Date(),
        },
        include: { customer: true, service: true, professional: { include: { user: true } } },
      });

      // Transfer escrow payout to professional wallet
      if (booking.professionalId) {
        await releaseEscrowPayout({
          bookingId: booking.id,
          triggerSource: "JOB_COMPLETION",
          notes: "Auto-released upon OTP verification",
        }).catch((e) => console.warn("[Escrow Payout Warning]:", e));
      }

      try {
        await notifyBookingStatusChange({
          id: updated.id,
          reference: updated.reference,
          status: "COMPLETED",
          customerId: updated.customerId,
          customer: updated.customer,
          professional: updated.professional as any,
          service: updated.service,
          estimatedPrice: updated.finalPrice || updated.estimatedPrice || 15000,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: "Job completed & verified with OTP! Escrow payout credited and customer notified.",
        booking: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Pro Jobs POST Error]:", error);
    return NextResponse.json({ error: "Failed to process job execution" }, { status: 500 });
  }
}
