import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST: Create a new booking
export async function POST(request: Request) {
  try {
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

    // Validate required fields
    if (!serviceId || !scheduledDate || !scheduledTime || !address) {
      return NextResponse.json(
        { error: "Service, date, time, and address are required" },
        { status: 400 }
      );
    }

    // Get the service to verify it exists and get the price
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { category: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Generate a booking reference
    const ref = `HHP-${Date.now().toString(36).toUpperCase()}`;

    // Find or assign a professional
    let assignedProfessionalId: string | null = null;
    if (!autoAssign && technicianId) {
      assignedProfessionalId = technicianId;
    } else {
      // Auto-assign: find the highest-rated available professional
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

    // Use demo customer for now (will use session-based auth later)
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
        // Increment promo usage
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
        specialNotes: specialNotes || null,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime,
        address: address,
        landmark: landmark || null,
        estimatedPrice: finalPrice,
        discountAmount: finalDiscount,
        paymentMethod: paymentMethod || "paystack",
        promoCodeId: promoCodeId,
      },
    });

    // Create notification for the customer
    await prisma.notification.create({
      data: {
        userId: demoCustomer.id,
        type: "BOOKING",
        title: "Booking Confirmed! 🎉",
        message: `Your booking for ${service.name} (${ref}) has been placed successfully. Scheduled for ${scheduledDate} at ${scheduledTime}.`,
        data: JSON.stringify({ link: `/dashboard/bookings/${booking.id}` }),
      },
    });

    // Create notification for the assigned professional
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

    // Log audit
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

    return NextResponse.json({
      booking,
      reference: ref,
      message: "Booking created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Fetch bookings (for dashboard)
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
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
