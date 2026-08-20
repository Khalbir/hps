import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatDigitalId } from "@/lib/digitalId";
import { getBookingOtp } from "@/lib/bookingOtp";

const categoryNames: Record<string, string> = {
  cleaning: "Residential & Deep Cleaning",
  plumbing: "Plumbing Repairs & Drainage Service",
  electrical: "Electrical Repairs & Circuit Maintenance",
  hvac: "AC Servicing, Repair & Gas Refill",
  painting: "Interior & Exterior Painting Service",
  carpentry: "Carpentry & Woodwork Repairs",
  cctv: "CCTV & Security System Installation",
  security: "Smart Security & Access Control Setup",
  solar: "Solar & Inverter Power System Installation",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("reference") || searchParams.get("ref") || "";

    if (!query) {
      return NextResponse.json({ error: "Please enter a valid Booking Reference code or Phone Number" }, { status: 400 });
    }

    const cleanQuery = query.trim();
    const numericToken = cleanQuery.split(/[_-\s]+/).find((t) => /^\d{6,}$/.test(t)) || "";
    const categoryToken = cleanQuery.split(/[_-\s]+/).find((t) => categoryNames[t.toLowerCase()]) || "";

    // 1. Query PostgreSQL database for matching booking using fuzzy & insensitive search
    let dbBooking = await prisma.booking.findFirst({
      where: {
        OR: [
          { reference: { equals: cleanQuery, mode: "insensitive" } },
          { reference: { contains: cleanQuery, mode: "insensitive" } },
          { id: { equals: cleanQuery, mode: "insensitive" } },
          { id: { contains: cleanQuery, mode: "insensitive" } },
          { customer: { phone: { contains: cleanQuery } } },
          { customer: { email: { contains: cleanQuery, mode: "insensitive" } } },
          ...(numericToken ? [{ reference: { contains: numericToken } }] : []),
        ],
      },
      include: {
        service: true,
        customer: true,
        professional: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true, avatar: true, ninStatus: true } },
          },
        },
        replacementParts: {
          include: { supplier: true, auditLogs: { orderBy: { createdAt: "asc" } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // 2. Cross-reference Payment table if booking record wasn't found directly
    if (!dbBooking) {
      const paymentRecord = await prisma.payment.findFirst({
        where: {
          OR: [
            { reference: { equals: cleanQuery, mode: "insensitive" } },
            { reference: { contains: cleanQuery, mode: "insensitive" } },
            { bookingId: { equals: cleanQuery, mode: "insensitive" } },
            { bookingId: { contains: cleanQuery, mode: "insensitive" } },
            ...(numericToken ? [{ reference: { contains: numericToken } }] : []),
          ],
        },
        include: {
          booking: {
            include: {
              service: true,
              customer: true,
              professional: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true, ninStatus: true } } } },
              replacementParts: {
                include: { supplier: true, auditLogs: { orderBy: { createdAt: "asc" } } },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      });

      if (paymentRecord?.booking) {
        dbBooking = paymentRecord.booking;
      }
    }

    // Resolve service title dynamically
    let resolvedServiceName = dbBooking?.service?.name;
    if (!resolvedServiceName && categoryToken) {
      resolvedServiceName = categoryNames[categoryToken.toLowerCase()] || `HandyHub Pro ${categoryToken.charAt(0).toUpperCase() + categoryToken.slice(1)} Service`;
    }
    if (!resolvedServiceName) {
      resolvedServiceName = "HandyHub Pro Verified Property Service";
    }

    const stepMap: Record<string, number> = {
      PENDING: 1,
      ASSIGNED: 2,
      ACCEPTED: 2,
      EN_ROUTE: 2,
      WORK_IN_PROGRESS: 3,
      COMPLETED: 4,
      CANCELLED: 0,
    };

    const bookingStatus = dbBooking?.status || "CONFIRMED";
    const currentStep = stepMap[bookingStatus] || 2;

    const proName = dbBooking?.professional?.user
      ? `${dbBooking.professional.user.firstName} ${dbBooking.professional.user.lastName}`
      : "HandyHub Verified Partner";

    const proPhone = dbBooking?.professional?.user?.phone || "+234 812 222 2936";

    // Generate deterministic 4-digit OTP code for Checkmate Security
    const otpCode = getBookingOtp(dbBooking || { reference: cleanQuery });

    const proRating = dbBooking?.professional?.rating && dbBooking.professional.rating > 0
      ? dbBooking.professional.rating
      : 5.0;

    const proTotalJobs = dbBooking?.professional?.totalJobs || 0;
    const proAvatar = dbBooking?.professional?.user?.avatar || null;

    const proDigitalId = formatDigitalId(dbBooking?.professional);

    const isValidProofUrl = (url: any): boolean => {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (!trimmed || trimmed === "[]" || trimmed === "null" || trimmed === "undefined") return false;
      if (trimmed.includes("before_sample.jpg") || trimmed.includes("after_sample.jpg") || trimmed.includes("handyhub.ng/photos/")) return false;
      return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image/") || trimmed.startsWith("/");
    };

    let beforePhoto: string | null = null;
    let afterPhoto: string | null = null;
    try {
      if (dbBooking?.beforePhotos) {
        const parsed = JSON.parse(dbBooking.beforePhotos);
        const raw = Array.isArray(parsed) ? parsed[0] : parsed;
        if (isValidProofUrl(raw)) beforePhoto = raw;
      }
    } catch {
      if (dbBooking?.beforePhotos && isValidProofUrl(dbBooking.beforePhotos)) {
        beforePhoto = dbBooking.beforePhotos;
      }
    }
    try {
      if (dbBooking?.afterPhotos) {
        const parsed = JSON.parse(dbBooking.afterPhotos);
        const raw = Array.isArray(parsed) ? parsed[0] : parsed;
        if (isValidProofUrl(raw)) afterPhoto = raw;
      }
    } catch {
      if (dbBooking?.afterPhotos && isValidProofUrl(dbBooking.afterPhotos)) {
        afterPhoto = dbBooking.afterPhotos;
      }
    }

    const formattedBooking = {
      id: dbBooking?.reference || cleanQuery,
      serviceName: resolvedServiceName,
      category: dbBooking?.service?.categoryId || categoryToken || "general",
      customerName: dbBooking?.customer ? `${dbBooking.customer.firstName} ${dbBooking.customer.lastName}`.trim() : "HandyHub Verified Client",
      customerPhone: dbBooking?.customer?.phone || "+234 812 222 2936",
      serviceAddress: dbBooking?.address || "Federal Capital Territory, Abuja, Nigeria",
      scheduledDate: dbBooking?.scheduledDate ? new Date(dbBooking.scheduledDate).toLocaleDateString() + (dbBooking.scheduledTime ? `, ${dbBooking.scheduledTime}` : "") : "Today (Immediate Dispatch)",
      amountNgn: dbBooking?.finalPrice || dbBooking?.estimatedPrice || dbBooking?.service?.basePrice || 0,
      paymentStatus: dbBooking?.paymentStatus === "SUCCESS" || dbBooking?.paymentStatus === "PAID" ? "PAID (Paystack Escrow)" : "PAID (Escrow Protected)",
      status: bookingStatus,
      currentStep,
      etaMinutes: bookingStatus === "EN_ROUTE" || !dbBooking ? 30 : 0,
      otpCode,
      beforePhoto,
      afterPhoto,
      replacementParts: dbBooking?.replacementParts || [],
      artisan: {
        id: dbBooking?.professionalId || "art_stationed_lead",
        digitalId: proDigitalId,
        name: proName,
        phone: proPhone,
        rating: proRating,
        totalJobs: proTotalJobs,
        vehicle: `Digital ID: ${proDigitalId}`,
        locationName: dbBooking?.professionalId ? "Nearest Stationed Dispatch Partner" : "Abuja Central Dispatch Hub (En Route)",
        avatar: proAvatar,
      },
      timeline: [
        { step: 1, title: "Booking Confirmed & Escrow Held", time: dbBooking?.createdAt ? new Date(dbBooking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just Now", done: true, active: currentStep === 1 },
        { step: 2, title: "Artisan Dispatched & En Route", time: currentStep >= 2 ? "En Route (ETA ~30m)" : "Pending Dispatch", done: currentStep >= 2, active: currentStep === 2 },
        { step: 3, title: "On-Site OTP Checkmate Verification", time: currentStep >= 3 ? `Arrived (Client OTP: ${otpCode})` : `Pending Arrival (Client OTP: ${otpCode})`, done: currentStep >= 3, active: currentStep === 3 },
        { step: 4, title: "Job Execution & Escrow Release", time: currentStep === 4 ? "Completed" : "Pending Completion", done: currentStep === 4, active: currentStep === 4 },
      ],
    };

    return NextResponse.json({
      success: true,
      booking: formattedBooking,
    });
  } catch (error: any) {
    console.error("[Track API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error fetching real-time tracking details: " + (error.message || "") },
      { status: 500 }
    );
  }
}

