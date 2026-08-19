import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeReceiptHash, logPartAudit } from "@/lib/parts";
import { sendMultiChannelNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      partId,
      receiptPhotos = [],
      installedPhotos = [],
      notes,
      artisanId,
    } = body;

    if (!partId) {
      return NextResponse.json({ error: "Part ID is required." }, { status: 400 });
    }

    const part = await prisma.replacementPart.findUnique({
      where: { id: partId },
      include: {
        customer: true,
        professional: { include: { user: true } },
        booking: { include: { service: true } },
      },
    });

    if (!part) {
      return NextResponse.json({ error: "Replacement part not found." }, { status: 404 });
    }

    if (part.status !== "VOUCHER_ISSUED" && part.status !== "PURCHASED") {
      return NextResponse.json(
        { error: `Part must be in VOUCHER_ISSUED or PURCHASED status (Current: ${part.status}).` },
        { status: 400 }
      );
    }

    const receiptsArray = Array.isArray(receiptPhotos)
      ? receiptPhotos
      : receiptPhotos
      ? [receiptPhotos]
      : [];
    const installedArray = Array.isArray(installedPhotos)
      ? installedPhotos
      : installedPhotos
      ? [installedPhotos]
      : [];

    if (installedArray.length === 0) {
      return NextResponse.json(
        { error: "At least one photo of the newly installed part is required." },
        { status: 400 }
      );
    }

    // =========================================================================
    // FRAUD CHECK 1: DUPLICATE RECEIPT HASH DETECTION (SHA-256)
    // =========================================================================
    let receiptHash: string | null = null;
    let isDuplicateReceipt = false;
    let conflictingPartRef = "";

    if (receiptsArray.length > 0) {
      receiptHash = computeReceiptHash(receiptsArray[0]);

      // Check if this hash exists on ANY other part record
      const existingMatch = await prisma.replacementPart.findFirst({
        where: {
          receiptHash,
          id: { not: part.id },
        },
      });

      if (existingMatch) {
        isDuplicateReceipt = true;
        conflictingPartRef = existingMatch.reference;
      }
    }

    if (isDuplicateReceipt) {
      // Flag for fraud
      const flaggedPart = await prisma.replacementPart.update({
        where: { id: partId },
        data: {
          status: "FLAGGED_FRAUD",
          receiptHash,
          receiptPhotos: JSON.stringify(receiptsArray),
          installedPhotos: JSON.stringify(installedArray),
          adminNotes: `[FRAUD ALERT] Duplicate receipt detected. Image matches previous submission for Part #${conflictingPartRef}.`,
        },
      });

      await logPartAudit({
        partId: part.id,
        actorId: part.professional?.userId,
        actorRole: "ARTISAN",
        action: "FLAGGED_FRAUD",
        notes: `FRAUD SYSTEM TRIGGER: Duplicate receipt detected matching #${conflictingPartRef}. Flagged for administrative investigation.`,
        metadata: { conflictingPartRef, receiptHash },
      });

      return NextResponse.json(
        {
          error: `Fraud Safeguard Triggered: This receipt photo matches an invoice previously submitted for Part #${conflictingPartRef}. This transaction has been flagged for audit review.`,
          flagged: true,
          part: flaggedPart,
        },
        { status: 409 }
      );
    }

    // Normal successful installation recording
    const updatedPart = await prisma.replacementPart.update({
      where: { id: partId },
      data: {
        status: "INSTALLED_VERIFIED",
        receiptPhotos: JSON.stringify(receiptsArray),
        receiptHash,
        installedPhotos: JSON.stringify(installedArray),
        adminNotes: notes ? `Artisan notes: ${notes}` : undefined,
      },
      include: {
        customer: true,
        professional: { include: { user: true } },
        supplier: true,
        booking: true,
      },
    });

    // Write immutable audit log
    await logPartAudit({
      partId: part.id,
      actorId: part.professional?.userId,
      actorRole: "ARTISAN",
      action: "INSTALLED",
      notes: `Artisan uploaded receipt and verified installed part photos. Part status updated to INSTALLED_VERIFIED.`,
      metadata: { receiptPhotosCount: receiptsArray.length, installedPhotosCount: installedArray.length },
    });

    // Notify client that part installation is verified
    await sendMultiChannelNotification({
      userId: part.customerId,
      type: "BOOKING",
      title: "✨ Replacement Part Installed & Verified",
      message: `Artisan has fitted the approved replacement part (${part.partName}) and uploaded inspection photos. Please test and inspect the work.`,
      bookingRef: part.booking.reference,
      metadata: { partId: part.id, status: "INSTALLED_VERIFIED" },
    });

    return NextResponse.json({
      success: true,
      message: "Replacement part marked as installed and verified.",
      part: updatedPart,
    });
  } catch (err: any) {
    console.error("[Part Install POST Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to record replacement part installation." },
      { status: 500 }
    );
  }
}
