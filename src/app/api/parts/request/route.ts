import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CATEGORY_PRICE_BOUNDS,
  findSupplierForCategory,
  logPartAudit,
} from "@/lib/parts";
import { sendClientPartAuthorizationAlert } from "@/lib/whatsapp";
import { sendMultiChannelNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      bookingId,
      artisanId,
      partName,
      partNumber,
      category = "GENERAL",
      reason,
      quantity = 1,
      estimatedCost,
      evidencePhotos = [],
      description,
    } = body;

    if (!bookingId || !partName || !reason || !estimatedCost) {
      return NextResponse.json(
        { error: "Booking ID, Part Name, Reason, and Estimated Cost are required." },
        { status: 400 }
      );
    }

    const costNum = Number(estimatedCost);
    if (isNaN(costNum) || costNum <= 0) {
      return NextResponse.json(
        { error: "Estimated cost must be a positive valid number." },
        { status: 400 }
      );
    }

    // Check category price threshold bounds
    const normalizedCategory = (category || "GENERAL").toUpperCase();
    const bounds = CATEGORY_PRICE_BOUNDS[normalizedCategory] || CATEGORY_PRICE_BOUNDS.GENERAL;
    if (costNum > bounds.max) {
      return NextResponse.json(
        {
          error: `The estimated cost of ₦${costNum.toLocaleString()} exceeds the safety threshold of ₦${bounds.max.toLocaleString()} for ${bounds.label}. Please contact admin support for high-value procurement authorization.`,
        },
        { status: 400 }
      );
    }

    // Verify booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        professional: { include: { user: true } },
        service: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // Determine professional ID
    const effectiveProId = booking.professionalId || artisanId;
    if (!effectiveProId) {
      return NextResponse.json(
        { error: "No artisan is currently assigned to this booking." },
        { status: 400 }
      );
    }

    // Link default verified supplier in this category
    const supplier = await findSupplierForCategory(normalizedCategory);

    // Generate part reference
    const count = await prisma.replacementPart.count();
    const refNumber = 1000 + count + 1;
    const reference = `HHP-PART-${refNumber}`;

    // Normalize photos array
    const photosArray = Array.isArray(evidencePhotos)
      ? evidencePhotos
      : evidencePhotos
      ? [evidencePhotos]
      : [];

    // Create ReplacementPart record
    const part = await prisma.replacementPart.create({
      data: {
        reference,
        bookingId: booking.id,
        customerId: booking.customerId,
        professionalId: effectiveProId,
        supplierId: supplier?.id || null,
        partName: partName.trim(),
        partNumber: partNumber?.trim() || null,
        category: normalizedCategory,
        reason: reason.trim(),
        quantity: Math.max(1, Number(quantity) || 1),
        estimatedCost: costNum,
        description: description?.trim() || null,
        evidencePhotos: JSON.stringify(photosArray),
        status: "REQUESTED",
        paymentStatus: "PENDING",
      },
      include: {
        customer: true,
        professional: { include: { user: true } },
        supplier: true,
        booking: { include: { service: true } },
      },
    });

    // Write immutable audit log
    await logPartAudit({
      partId: part.id,
      actorId: booking.professional?.userId,
      actorRole: "ARTISAN",
      action: "REQUESTED",
      notes: `Artisan requested replacement for ${part.partName} (₦${costNum.toLocaleString()}) with ${photosArray.length} photo(s). Reason: ${reason}`,
      metadata: { estimatedCost: costNum, quantity, category: normalizedCategory },
    });

    // Multi-channel alert to customer
    const clientPhone = booking.customer.phone;
    const clientName = `${booking.customer.firstName} ${booking.customer.lastName}`;
    const proName = booking.professional
      ? `${booking.professional.user.firstName} ${booking.professional.user.lastName}`
      : "Assigned Artisan";

    // 1. In-App Notification
    await sendMultiChannelNotification({
      userId: booking.customerId,
      type: "BOOKING",
      title: "⚙️ Part Replacement Authorization Required",
      message: `Artisan ${proName} has diagnosed that a replacement component (${part.partName}, ₦${costNum.toLocaleString()}) is required. Review photo evidence and authorize payment to HandyHub Escrow.`,
      bookingRef: booking.reference,
      metadata: { partId: part.id, partRef: part.reference, amount: costNum },
    });

    // 2. WhatsApp Notification
    if (clientPhone) {
      await sendClientPartAuthorizationAlert({
        clientPhone,
        clientName,
        artisanName: proName,
        serviceName: booking.service.name,
        bookingRef: booking.reference,
        partName: part.partName,
        reason: part.reason,
        estimatedCost: costNum,
        quantity: part.quantity,
      }).catch((e) => console.warn("[WhatsApp Part Alert Warning]", e));
    }

    return NextResponse.json({
      success: true,
      message: "Replacement part request submitted and client alerted.",
      part,
    });
  } catch (err: any) {
    console.error("[Part Request POST Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit replacement part request." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const customerId = searchParams.get("customerId");
    const professionalId = searchParams.get("professionalId");
    const partId = searchParams.get("partId");
    const reference = searchParams.get("reference");

    const where: any = {};
    if (bookingId) where.bookingId = bookingId;
    if (customerId) where.customerId = customerId;
    if (professionalId) where.professionalId = professionalId;
    if (partId) where.id = partId;
    if (reference) where.reference = reference;

    const parts = await prisma.replacementPart.findMany({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        professional: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        supplier: true,
        booking: {
          select: {
            id: true,
            reference: true,
            status: true,
            address: true,
            service: { select: { name: true } },
          },
        },
        auditLogs: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, parts });
  } catch (err: any) {
    console.error("[Part Request GET Error]", err);
    return NextResponse.json(
      { error: "Failed to fetch replacement parts." },
      { status: 500 }
    );
  }
}
