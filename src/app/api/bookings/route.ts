import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, sanitizeInput } from "@/lib/security";

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
    if (!serviceId || !scheduledDate || !scheduledTime || !address) {
      return NextResponse.json(
        { error: "Service, date, time, and address are required" },
        { status: 400 }
      );
    }

    const sanitizedAddress = sanitizeInput(address);
    const sanitizedLandmark = landmark ? sanitizeInput(landmark) : null;
    const sanitizedNotes = specialNotes ? sanitizeInput(specialNotes) : null;

    // Get service to verify existence
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { category: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // MANDATORY ARTISAN VERIFICATION GATING CHECK
    let assignedProfessionalId: string | null = null;
    if (!autoAssign && technicianId) {
      const selectedPro = await prisma.professional.findUnique({
        where: { id: technicianId },
      });

      if (!selectedPro || selectedPro.verificationStatus !== "VERIFIED") {
        return NextResponse.json(
          { error: "Selected artisan is not yet verified. Bookings are strictly restricted to verified artisans only." },
          { status: 403 }
        );
      }
      assignedProfessionalId = selectedPro.id;
    } else {
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

    const demoCustomer = await prisma.user.findFirst({
      where: { role: "CUSTOMER" },
    });

    if (!demoCustomer) {
      return NextResponse.json(
        { error: "No customer account found. Please register first." },
        { status: 400 }
      );
    }

    // Apply promo code if provided
    let finalDiscount = 0;
    let promoCodeId: string | null = null;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });
      if (promo && promo.isActive && promo.usedCount < promo.maxUses) {
        if (promo.discountType === "PERCENTAGE") {
          finalDiscount = Math.min(
            (totalPrice * promo.discountValue) / 100,
            promo.maxDiscount || totalPrice
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

    const finalPrice = Math.max(0, totalPrice - finalDiscount);

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        reference: ref,
        customerId: demoCustomer.id,
        serviceId: serviceId,
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
        estimatedPrice: finalPrice,
        discountAmount: finalDiscount,
        paymentMethod: paymentMethod || "paystack",
        promoCodeId: promoCodeId,
      },
    });

    // Create notification for customer
    await prisma.notification.create({
      data: {
        userId: demoCustomer.id,
        type: "BOOKING",
        title: "Booking Confirmed! 🎉",
        message: `Your booking for ${service.name} (${ref}) has been placed successfully. Scheduled for ${scheduledDate} at ${scheduledTime}.`,
        data: JSON.stringify({ link: `/dashboard/bookings/${booking.id}` }),
      },
    });

    // Create notification for assigned professional if verified
    if (assignedProfessionalId) {
      const pro = await prisma.professional.findUnique({
        where: { id: assignedProfessionalId },
        include: { user: true },
      });
      if (pro) {
        await prisma.notification.create({
          data: {
            userId: pro.userId,
            type: "BOOKING",
            title: "New Job Assignment 📋",
            message: `You have been assigned a new ${service.name} job. Scheduled for ${scheduledDate} at ${scheduledTime}.`,
            data: JSON.stringify({ link: `/pro/jobs/${booking.id}` }),
          },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: demoCustomer.id,
        action: "BOOKING_CREATED",
        entity: "Booking",
        entityId: booking.id,
        details: JSON.stringify({
          reference: ref,
          service: service.name,
          total: finalPrice,
          emergency: isEmergency,
        }),
      },
    });

    return NextResponse.json(
      {
        booking,
        reference: ref,
        message: "Booking created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Fetch bookings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: {
          include: { category: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        professional: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
