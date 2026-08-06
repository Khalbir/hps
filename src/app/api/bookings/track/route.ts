import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("reference") || searchParams.get("ref") || "";

    if (!query) {
      return NextResponse.json({ error: "Please enter a valid Booking Reference code or Phone Number" }, { status: 400 });
    }

    const cleanQuery = query.trim();

    // Query real PostgreSQL database for matching booking
    let dbBooking = await prisma.booking.findFirst({
      where: {
        OR: [
          { reference: { equals: cleanQuery, mode: "insensitive" } },
          { id: cleanQuery },
          { customer: { phone: { contains: cleanQuery } } },
          { customer: { email: { contains: cleanQuery, mode: "insensitive" } } },
        ],
      },
      include: {
        service: true,
        customer: true,
        professional: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });

    if (!dbBooking) {
      return NextResponse.json(
        { error: `No active booking dispatch found for reference "${cleanQuery}". Please check your booking code.` },
        { status: 404 }
      );
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

    const currentStep = stepMap[dbBooking.status] || 1;

    const proName = dbBooking.professional?.user
      ? `${dbBooking.professional.user.firstName} ${dbBooking.professional.user.lastName}`
      : "Location Intelligence (Auto-Assign Active)";

    const proPhone = dbBooking.professional?.user?.phone || "+234 800 000 0000";

    const formattedBooking = {
      id: dbBooking.reference,
      serviceName: dbBooking.service?.name || "Verified Property Service",
      category: dbBooking.service?.categoryId || "general",
      customerName: dbBooking.customer ? `${dbBooking.customer.firstName} ${dbBooking.customer.lastName}` : "Valued Customer",
      customerPhone: dbBooking.customer?.phone || "Not Provided",
      serviceAddress: dbBooking.address || "Abuja, FCT, Nigeria",
      scheduledDate: new Date(dbBooking.scheduledDate).toLocaleDateString() + ", " + dbBooking.scheduledTime,
      amountNgn: dbBooking.finalPrice || dbBooking.estimatedPrice || 15000,
      paymentStatus: dbBooking.paymentStatus === "SUCCESS" ? "PAID (Paystack Escrow)" : dbBooking.paymentStatus,
      status: dbBooking.status,
      currentStep,
      etaMinutes: dbBooking.status === "EN_ROUTE" ? 15 : 0,
      otpCode: dbBooking.completionNote || "4-Digit OTP Generated",
      artisan: {
        id: dbBooking.professionalId || "art_unassigned",
        name: proName,
        phone: proPhone,
        rating: dbBooking.professional?.rating || 5.0,
        totalJobs: 0,
        vehicle: "Verified Dispatch Service Vehicle",
        locationName: dbBooking.professionalId ? "Nearest Stationed Dispatch Partner" : "Auto-Assigning Nearest Verified Partner",
      },
      timeline: [
        { step: 1, title: "Booking Confirmed & Escrow Held", time: new Date(dbBooking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: currentStep >= 1, active: currentStep === 1 },
        { step: 2, title: "Artisan Dispatched & En Route", time: currentStep >= 2 ? "Dispatched" : "Pending", done: currentStep >= 2, active: currentStep === 2 },
        { step: 3, title: "On-Site OTP Checkmate Verification", time: currentStep >= 3 ? "Arrived" : "Pending Arrival", done: currentStep >= 3, active: currentStep === 3 },
        { step: 4, title: "Job Execution & Escrow Release", time: currentStep === 4 ? "Completed" : "Pending Completion", done: currentStep === 4, active: currentStep === 4 },
      ],
    };

    return NextResponse.json({
      success: true,
      booking: formattedBooking,
    });
  } catch (error) {
    console.error("[Track API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error fetching real-time tracking details" },
      { status: 500 }
    );
  }
}
