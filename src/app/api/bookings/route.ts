import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, sanitizeInput } from "@/lib/security";
import { notifyBookingStatusChange } from "@/lib/notifications";
import { getBookingOtp } from "@/lib/bookingOtp";

export const dynamic = "force-dynamic";

// POST: Create a new booking
export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check (30 requests / min)
    const ip = request.headers.get("x-forwarded-for") || "client_ip";
    const rateCheck = checkRateLimit(`booking_post_${ip}`, 30);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many booking requests. Please try again in 1 minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      serviceId,
      serviceCategory,
      serviceName,
      customerEmail,
      propertyType,
      bedrooms,
      bathrooms,
      specialNotes,
      scheduledDate,
      scheduledTime,
      isEmergency,
      address,
      landmark,
      paymentMethod,
      promoCode,
      discountAmount,
      totalPrice,
      technicianId,
      autoAssign,
    } = body;

    // Validate required fields & sanitize inputs
    if (!scheduledDate || !scheduledTime || !address) {
      return NextResponse.json(
        { error: "Date, time, and address are required to confirm booking" },
        { status: 400 }
      );
    }

    const sanitizedAddress = sanitizeInput(address);
    const sanitizedLandmark = landmark ? sanitizeInput(landmark) : null;
    const sanitizedNotes = specialNotes ? sanitizeInput(specialNotes) : null;

    // 2. Resolve Service Entity in Database
    let service = null;
    if (serviceId) {
      service = await prisma.service.findUnique({ where: { id: serviceId } });
    }

    if (!service) {
      service = await prisma.service.findFirst();
    }

    if (!service) {
      // Ensure category exists
      let cat = await prisma.serviceCategory.findFirst();
      if (!cat) {
        cat = await prisma.serviceCategory.create({
          data: {
            name: serviceCategory || "Home Services",
            slug: (serviceCategory || "home-services").toLowerCase().replace(/\s+/g, "-"),
            description: "Verified professional home services",
          },
        });
      }

      service = await prisma.service.create({
        data: {
          categoryId: cat.id,
          name: serviceName || "General Home Maintenance",
          slug: (serviceName || "general-maintenance").toLowerCase().replace(/\s+/g, "-"),
          description: "Professional verified home service",
          basePrice: totalPrice || 15000,
        },
      });
    }

    // 3. Resolve Customer Account
    let customerUser = null;
    if (customerEmail) {
      customerUser = await prisma.user.findUnique({ where: { email: customerEmail.toLowerCase().trim() } });
    }

    if (!customerUser) {
      customerUser = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    }

    if (!customerUser) {
      const email = customerEmail ? customerEmail.toLowerCase().trim() : `customer_${Date.now()}@handyhubpro.ng`;
      customerUser = await prisma.user.create({
        data: {
          email,
          firstName: "Valued",
          lastName: "Customer",
          password: `guest_${Date.now()}`,
          role: "CUSTOMER",
          isVerified: true,
        },
      });
    }

    // 4. MANDATORY ARTISAN VERIFICATION GATING CHECK
    let assignedProfessionalId: string | null = null;
    if (!autoAssign && technicianId) {
      const selectedPro = await prisma.professional.findUnique({
        where: { id: technicianId },
      });

      if (selectedPro && (selectedPro.verificationStatus === "VERIFIED" || selectedPro.verificationStatus === "APPROVED")) {
        assignedProfessionalId = selectedPro.id;
      }
    }

    if (!assignedProfessionalId) {
      // Auto-assign: Only select from VERIFIED professionals
      const availablePro = await prisma.professional.findFirst({
        where: {
          isAvailable: true,
          verificationStatus: "VERIFIED",
        },
        orderBy: { rating: "desc" },
      });
      if (availablePro) {
        assignedProfessionalId = availablePro.id;
      }
    }

    const ref = `HHP-${Date.now().toString(36).toUpperCase()}`;

    // Apply promo code if provided
    let finalDiscount = discountAmount || 0;
    let promoCodeId: string | null = null;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });
      if (promo && promo.isActive && promo.usedCount < promo.maxUses) {
        if (promo.discountType === "PERCENTAGE") {
          finalDiscount = Math.min(
            ((totalPrice || 15000) * promo.discountValue) / 100,
            promo.maxDiscount || (totalPrice || 15000)
          );
        } else {
          finalDiscount = promo.discountValue;
        }
        promoCodeId = promo.id;
        await prisma.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const calculatedPrice = Math.max(0, (totalPrice || 15000) - finalDiscount);

    // Create the booking record
    const booking = await prisma.booking.create({
      data: {
        reference: ref,
        customerId: customerUser.id,
        serviceId: service.id,
        professionalId: assignedProfessionalId,
        status: "PENDING",
        propertyType: propertyType || "HOME",
        bedrooms: bedrooms || 1,
        bathrooms: bathrooms || 1,
        specialNotes: sanitizedNotes,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime,
        address: sanitizedAddress,
        landmark: sanitizedLandmark,
        paymentMethod: (paymentMethod || "paystack").toUpperCase(),
        paymentStatus: "SUCCESS",
        estimatedPrice: calculatedPrice,
        finalPrice: calculatedPrice,
        completionNote: getBookingOtp({ reference: ref }),
        promoCodeId: promoCodeId,
        discountAmount: finalDiscount,
      },
    });

    const fullBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        service: true,
        professional: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });

    // Dispatch live multi-channel notification (Email + WhatsApp + In-App)
    try {
      await notifyBookingStatusChange({
        id: booking.id,
        reference: booking.reference,
        status: assignedProfessionalId ? "ASSIGNED" : "PENDING",
        customerId: customerUser.id,
        customer: {
          email: customerUser.email,
          phone: customerUser.phone,
          firstName: customerUser.firstName,
          lastName: customerUser.lastName,
        },
        professional: fullBooking?.professional as any,
        service: fullBooking?.service || service,
        estimatedPrice: calculatedPrice,
        scheduledTime: scheduledTime,
      });
    } catch (notifErr) {
      console.warn("[Booking Creation Notification Warning]:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Booking confirmed successfully",
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        finalPrice: booking.finalPrice,
        serviceName: fullBooking?.service?.name || service.name,
        assignedPro: fullBooking?.professional?.user
          ? `${fullBooking.professional.user.firstName} ${fullBooking.professional.user.lastName}`
          : "Auto-assigned (Location Intelligence)",
      },
    });
  } catch (error: any) {
    console.error("[Bookings POST Exception]:", error);
    return NextResponse.json(
      { error: "Failed to process booking creation. Please try again." },
      { status: 500 }
    );
  }
}

// GET: Fetch bookings for customer or admin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    let whereClause: any = {};
    if (userId) {
      whereClause.customerId = userId;
    } else if (email) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (user) whereClause.customerId = user.id;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        service: { select: { name: true } },
        professional: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
      },
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error("[Bookings GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
