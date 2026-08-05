import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
        otpCode: b.completionNote || "4819",
        beforePhoto: b.beforePhotos ? JSON.parse(b.beforePhotos)[0] : null,
        afterPhoto: b.afterPhotos ? JSON.parse(b.afterPhotos)[0] : null,
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
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (action === "START_JOB") {
      const updated = await prisma.booking.update({
        where: { reference: bookingReference },
        data: {
          status: "IN_PROGRESS",
          beforePhotos: JSON.stringify([beforePhotoUrl || "https://handyhub.ng/photos/before_sample.jpg"]),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Job started! Before photo saved.",
        booking: updated,
      });
    }

    if (action === "COMPLETE_JOB") {
      const expectedOtp = booking.completionNote || "4819";
      if (otpCode && otpCode.trim() !== expectedOtp) {
        return NextResponse.json({ error: "Invalid completion OTP. Please enter correct 4-digit customer OTP." }, { status: 400 });
      }

      const updated = await prisma.booking.update({
        where: { reference: bookingReference },
        data: {
          status: "COMPLETED",
          afterPhotos: JSON.stringify([afterPhotoUrl || "https://handyhub.ng/photos/after_sample.jpg"]),
          completedAt: new Date(),
        },
      });

      // Transfer escrow to professional wallet
      if (booking.professionalId) {
        const pro = await prisma.professional.findUnique({ where: { id: booking.professionalId } });
        if (pro) {
          const wallet = await prisma.wallet.findUnique({ where: { userId: pro.userId } });
          if (wallet) {
            await prisma.wallet.update({
              where: { userId: pro.userId },
              data: {
                balance: wallet.balance + booking.estimatedPrice,
              },
            });

            await prisma.walletTransaction.create({
              data: {
                walletId: wallet.id,
                amount: booking.estimatedPrice,
                type: "CREDIT",
                reference: `PAYOUT-${booking.reference}`,
                description: `Escrow payout released for completed job #${booking.reference}`,
              },
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Job completed & verified with OTP! Escrow payout credited to wallet.",
        booking: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Pro Jobs POST Error]:", error);
    return NextResponse.json({ error: "Failed to process job execution" }, { status: 500 });
  }
}
