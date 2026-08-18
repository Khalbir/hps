import { NextResponse } from "next/server";
import { initializeDualGatewayCheckout } from "@/lib/fintech";
import { prisma, ensureUserSchema } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amountNgn, bookingId, customerName, customerPhone, callbackUrl: customCallbackUrl, metadata } = body;

    if (!email || !amountNgn) {
      return NextResponse.json(
        { error: "Email and payment amount are required to initialize checkout" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Auto-heal database schema if missing columns exist
    await ensureUserSchema().catch(() => {});

    // AUTO-RESOLUTION: Safe case-insensitive lookup selecting strictly core fields
    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
        },
      });
    } catch (dbErr) {
      console.warn("[Payment Init DB Warning]:", dbErr);
    }

    if (!dbUser) {
      // Create user record on the fly so authenticated dashboard users are never blocked
      try {
        const nameParts = (customerName || cleanEmail.split("@")[0]).split(" ");
        const firstName = nameParts[0] || "Client";
        const lastName = nameParts.slice(1).join(" ") || "";
        const dummyPassword = await hash("ClientPass123!", 10);

        dbUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            firstName,
            lastName,
            password: dummyPassword,
            phone: customerPhone || null,
            role: "CUSTOMER",
            isVerified: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isVerified: true,
          },
        });
        await prisma.wallet.create({ data: { userId: dbUser.id, balance: 0 } }).catch(() => {});
      } catch {
        // Fallback search again safely
        try {
          dbUser = await prisma.user.findFirst({
            where: { email: { equals: cleanEmail, mode: "insensitive" } },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              isVerified: true,
            },
          });
        } catch {}
      }
    }

    const userId = dbUser?.id || `usr_${Date.now()}`;
    const sanitizedBookingId = bookingId ? String(bookingId).replace(/\s+/g, "_") : "BOOKING";
    const reference = `HHP_${sanitizedBookingId}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/$/, "") || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";
    
    // Dynamic callback URL resolution
    let finalCallbackUrl = customCallbackUrl;
    if (!finalCallbackUrl) {
      if (sanitizedBookingId.includes("TOPUP")) {
        finalCallbackUrl = `${origin}/dashboard/wallet?status=success&reference=${reference}`;
      } else {
        finalCallbackUrl = `${origin}/receipt/${reference}?status=success`;
      }
    }

    let createdBooking: any = null;

    // If this is a service booking (not a wallet topup), create the Booking record and run auto-dispatch
    if (!sanitizedBookingId.includes("TOPUP")) {
      try {
        const serviceCategory = metadata?.serviceCategory || bookingId || "cleaning";
        const serviceName = metadata?.serviceName || "Residential & Deep Cleaning";
        const cleanCatSlug = String(serviceCategory).toLowerCase().replace(/\s+/g, "-");

        // 1. Resolve or create Service Category & Service
        let serviceCat = await prisma.serviceCategory.findFirst({
          where: { slug: cleanCatSlug },
        });

        if (!serviceCat) {
          serviceCat = await prisma.serviceCategory.create({
            data: {
              name: String(serviceCategory).charAt(0).toUpperCase() + String(serviceCategory).slice(1),
              slug: cleanCatSlug,
              description: `Verified professional ${serviceCategory} service`,
            },
          }).catch(() => null);
        }

        let dbService = null;
        if (metadata?.serviceId) {
          dbService = await prisma.service.findUnique({ where: { id: metadata.serviceId } });
        }
        if (!dbService && serviceCat) {
          dbService = await prisma.service.findFirst({ where: { categoryId: serviceCat.id } });
        }
        if (!dbService) {
          dbService = await prisma.service.findFirst();
        }
        if (!dbService && serviceCat) {
          dbService = await prisma.service.create({
            data: {
              categoryId: serviceCat.id,
              name: serviceName,
              slug: String(serviceName).toLowerCase().replace(/\s+/g, "-"),
              description: "Verified professional home service",
              basePrice: Number(amountNgn),
            },
          });
        }

        // 2. RUN INTELLIGENT ARTISAN AUTO-ASSIGNMENT
        let assignedProId: string | null = null;

        // A. If client manually selected a specific artisan in Step 4
        if (metadata?.technicianId && !metadata?.autoAssign) {
          const selectedPro = await prisma.professional.findFirst({
            where: {
              OR: [{ id: metadata.technicianId }, { userId: metadata.technicianId }],
              verificationStatus: { in: ["VERIFIED", "APPROVED"] },
            },
          });
          if (selectedPro) {
            assignedProId = selectedPro.id;
          }
        }

        // B. Auto-assign: Match highest-rated verified artisan by skill category
        if (!assignedProId) {
          const allVerifiedPros = await prisma.professional.findMany({
            where: {
              verificationStatus: { in: ["VERIFIED", "APPROVED"] },
              isAvailable: true,
            },
            include: { user: true },
            orderBy: { rating: "desc" },
          });

          const catLower = String(serviceCategory).toLowerCase();
          const matchingPro = allVerifiedPros.find((p) => {
            try {
              const skillsArr = JSON.parse(p.skills || "[]");
              if (Array.isArray(skillsArr)) {
                return skillsArr.some((s: string) => s.toLowerCase().includes(catLower) || catLower.includes(s.toLowerCase()));
              }
            } catch {}
            return false;
          });

          if (matchingPro) {
            assignedProId = matchingPro.id;
          } else if (allVerifiedPros.length > 0) {
            // Fallback to top verified pro in the city
            assignedProId = allVerifiedPros[0].id;
          }
        }

        const bookingStatus = assignedProId ? "ASSIGNED" : "PENDING";

        // 3. Create the real Booking entity in the Prisma Database
        createdBooking = await prisma.booking.create({
          data: {
            reference,
            customerId: dbUser.id,
            serviceId: dbService ? dbService.id : "svc_default",
            professionalId: assignedProId,
            status: bookingStatus,
            propertyType: metadata?.propertyType || "HOME",
            bedrooms: Number(metadata?.bedrooms) || 2,
            bathrooms: Number(metadata?.bathrooms) || 1,
            specialNotes: metadata?.specialNotes || null,
            scheduledDate: metadata?.scheduledDate ? new Date(metadata.scheduledDate) : new Date(),
            scheduledTime: metadata?.scheduledTime || "09:00 AM",
            address: metadata?.address || dbUser.permanentAddress || "Abuja, FCT, Nigeria",
            landmark: metadata?.landmark || null,
            paymentMethod: "PAYSTACK",
            paymentStatus: "PENDING",
            estimatedPrice: Number(amountNgn),
            finalPrice: Number(amountNgn),
            promoCodeId: metadata?.promoCodeId || null,
            discountAmount: Number(metadata?.discountAmount) || 0,
            assignedAt: assignedProId ? new Date() : null,
          },
        });

        // 4. Create Payment transaction record linked to this booking
        await prisma.payment.create({
          data: {
            reference,
            bookingId: createdBooking.id,
            userId: dbUser.id,
            amount: Number(amountNgn),
            currency: "NGN",
            provider: "PAYSTACK",
            status: "PENDING",
            metadata: JSON.stringify({
              customerName: customerName || `${dbUser.firstName} ${dbUser.lastName}`,
              customerPhone: customerPhone || dbUser.phone,
              serviceName,
              assignedProId,
            }),
          },
        });
      } catch (bookingCreationErr) {
        console.warn("[Pre-Payment Booking Record Creation Warning]:", bookingCreationErr);
      }
    }

    // Initialize Paystack primary checkout
    const checkout = await initializeDualGatewayCheckout({
      email: cleanEmail,
      amountNgn: Number(amountNgn),
      reference,
      callbackUrl: finalCallbackUrl,
      customerName: customerName || (dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : "HandyHub Client"),
      customerPhone: customerPhone || dbUser?.phone || undefined,
      bookingId: createdBooking?.id || bookingId || undefined,
      metadata: {
        bookingId: createdBooking?.id || bookingId,
        bookingRef: reference,
        email: cleanEmail,
        userId,
        customerName: customerName || (dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : "HandyHub Client"),
        ...(metadata || {}),
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: checkout.authorizationUrl,
      checkout,
      reference: checkout.reference,
      bookingId: createdBooking?.id,
      message: checkout.isFallback
        ? "Payment route initialized via Failover Gateway"
        : "Payment route initialized via Paystack Primary Gateway",
    });
  } catch (error: any) {
    console.error("[Payment Init REST API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error initializing payment gateway: " + (error.message || "") },
      { status: 500 }
    );
  }
}
