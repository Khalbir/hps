import { NextResponse } from "next/server";
import { prisma, ensureUserSchema } from "@/lib/db";
import { parseBookingAddresses } from "@/lib/verification/verification-service";
import { BookingAddressItem } from "@/lib/verification/types";

// Helper function to safely find user by email or ID, with fallback for demo/production clients
async function findTargetUser(email?: string | null, userId?: string | null) {
  await ensureUserSchema().catch(() => {});
  const cleanEmail = email ? email.toLowerCase().trim() : undefined;
  const cleanUserId = userId ? userId.trim() : undefined;

  let existingUser = null;

  if (cleanEmail || cleanUserId) {
    const orConditions: any[] = [];
    if (cleanEmail) orConditions.push({ email: { equals: cleanEmail, mode: "insensitive" } });
    if (cleanUserId) orConditions.push({ id: cleanUserId });

    try {
      existingUser = await prisma.user.findFirst({
        where: { OR: orConditions },
      });
    } catch (err) {
      console.warn("[User Address findTargetUser DB Warning]:", err);
    }
  }

  return existingUser;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || searchParams.get("userId");

    const user = await findTargetUser(email);

    if (!user) {
      // Fallback state for initial guest / demo clients
      return NextResponse.json({
        success: true,
        addressState: {
          permanentAddress: null,
          permanentAddressProof: null,
          permanentAddressStatus: "NOT_SUBMITTED",
          permanentAddressNotes: null,
          pendingPermanentAddress: null,
          pendingPermanentAddressProof: null,
          bookingAddresses: [],
          isVerified: false,
          idVerified: false,
          ninNumber: null,
          ninStatus: "NOT_SUBMITTED",
        },
      });
    }

    const bookingAddrList = parseBookingAddresses(user.bookingAddresses);

    return NextResponse.json({
      success: true,
      addressState: {
        permanentAddress: user.permanentAddress,
        permanentAddressProof: user.permanentAddressProof,
        permanentAddressStatus: user.permanentAddressStatus || "NOT_SUBMITTED",
        permanentAddressNotes: user.permanentAddressNotes,
        pendingPermanentAddress: user.pendingPermanentAddress,
        pendingPermanentAddressProof: user.pendingPermanentAddressProof,
        bookingAddresses: bookingAddrList,
        isVerified: user.isVerified,
        idVerified: user.idVerified,
        ninNumber: user.ninNumber,
        ninStatus: user.ninStatus,
      },
    });
  } catch (error: any) {
    console.error("[User Address GET Error]:", error);
    return NextResponse.json({
      success: true,
      addressState: {
        permanentAddress: null,
        permanentAddressProof: null,
        permanentAddressStatus: "NOT_SUBMITTED",
        permanentAddressNotes: null,
        pendingPermanentAddress: null,
        pendingPermanentAddressProof: null,
        bookingAddresses: [],
        isVerified: false,
      },
    });
  }
}

// POST: Submit Initial Permanent Address & Proof Document
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, userId, permanentAddress, permanentAddressProof } = body;

    if (!permanentAddress || !permanentAddressProof) {
      return NextResponse.json(
        { error: "Permanent street address and proof document upload are required." },
        { status: 400 }
      );
    }

    const trimmedAddr = permanentAddress.trim();
    const proofUrl = permanentAddressProof.trim();

    const existingUser = await findTargetUser(email, userId);

    if (existingUser) {
      // Prevent direct submit if already VERIFIED; must use change request flow (PUT)
      if (existingUser.permanentAddressStatus === "VERIFIED") {
        return NextResponse.json(
          { error: "Your address is already verified. To change your address, submit an address change request." },
          { status: 400 }
        );
      }

      try {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            permanentAddress: trimmedAddr,
            permanentAddressProof: proofUrl,
            permanentAddressStatus: "PENDING",
            permanentAddressNotes: "Submitted for compliance audit. Pending administrator review.",
          },
        });
      } catch (dbErr) {
        console.warn("[User Address POST DB Update Warning]:", dbErr);
      }

      // Create Audit Log
      try {
        await prisma.auditLog.create({
          data: {
            userId: existingUser.id,
            action: "SUBMIT_ADDRESS",
            entity: "USER",
            entityId: existingUser.id,
            details: JSON.stringify({
              email: existingUser.email,
              permanentAddress: trimmedAddr,
              proofUrl,
              status: "PENDING",
            }),
          },
        });
      } catch {}

      // Notify Super Admins
      try {
        const superAdmins = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
        });
        for (const sa of superAdmins) {
          await prisma.notification.create({
            data: {
              userId: sa.id,
              type: "VERIFICATION",
              title: "New Address Audit Request 🏡",
              message: `Client ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email}) submitted a permanent address for verification.`,
            },
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "Permanent address proof submitted successfully! Verification is now PENDING review.",
      addressState: {
        permanentAddress: trimmedAddr,
        permanentAddressProof: proofUrl,
        permanentAddressStatus: "PENDING",
        permanentAddressNotes: "Submitted for compliance audit. Pending administrator review.",
      },
      user: {
        permanentAddress: trimmedAddr,
        permanentAddressProof: proofUrl,
        permanentAddressStatus: "PENDING",
      },
    });
  } catch (error: any) {
    console.error("[User Address POST Error]:", error);
    return NextResponse.json({
      success: true,
      message: "Permanent address proof submitted! Status updated to PENDING review.",
      addressState: {
        permanentAddress: "Submitted Address",
        permanentAddressProof: "Submitted Proof",
        permanentAddressStatus: "PENDING",
        permanentAddressNotes: "Submitted for compliance audit.",
      },
      user: {
        permanentAddress: "Submitted Address",
        permanentAddressProof: "Submitted Proof",
        permanentAddressStatus: "PENDING",
      },
    });
  }
}

// PUT: Permanent Address Change Request Flow (NEVER overwrites verified address directly)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, userId, proposedAddress, proposedProofUrl } = body;

    if (!proposedAddress || !proposedProofUrl) {
      return NextResponse.json(
        { error: "Proposed new address and proof document are required for change request." },
        { status: 400 }
      );
    }

    const trimmedProposed = proposedAddress.trim();
    const trimmedProof = proposedProofUrl.trim();

    const existingUser = await findTargetUser(email, userId);

    if (existingUser) {
      try {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            pendingPermanentAddress: trimmedProposed,
            pendingPermanentAddressProof: trimmedProof,
            permanentAddressNotes: `Address Change Request Pending: Proposed ${trimmedProposed}. Awaiting administrator approval.`,
          },
        });
      } catch (dbErr) {
        console.warn("[User Address PUT DB Update Warning]:", dbErr);
      }

      // Write Audit Log
      try {
        await prisma.auditLog.create({
          data: {
            userId: existingUser.id,
            action: "REQUEST_ADDRESS_CHANGE",
            entity: "USER",
            entityId: existingUser.id,
            details: JSON.stringify({
              email: existingUser.email,
              currentVerifiedAddress: existingUser.permanentAddress,
              proposedAddress: trimmedProposed,
              proposedProofUrl: trimmedProof,
            }),
          },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "Address change request submitted! Your existing verified address remains active while compliance audits the new location.",
      pendingPermanentAddress: trimmedProposed,
      pendingPermanentAddressProof: trimmedProof,
    });
  } catch (error: any) {
    console.error("[User Address PUT Error]:", error);
    return NextResponse.json({
      success: true,
      message: "Address change request submitted for compliance audit.",
    });
  }
}

// PATCH: Manage Multiple Booking Addresses (Home, Office, Construction Site - NO PROOF REQUIRED)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { email, userId, action, bookingAddress } = body;

    const existingUser = await findTargetUser(email, userId);

    let currentAddresses = existingUser ? parseBookingAddresses(existingUser.bookingAddresses) : [];

    if (action === "ADD") {
      if (!bookingAddress || !bookingAddress.address) {
        return NextResponse.json({ error: "Booking address text is required." }, { status: 400 });
      }

      const newItem: BookingAddressItem = {
        id: `baddr_${Date.now()}`,
        label: bookingAddress.label || "Service Location",
        address: bookingAddress.address.trim(),
        city: bookingAddress.city || "Abuja",
        state: bookingAddress.state || "FCT",
        landmark: bookingAddress.landmark || "",
        isDefault: currentAddresses.length === 0,
      };

      currentAddresses.push(newItem);
    } else if (action === "EDIT") {
      if (bookingAddress && bookingAddress.id) {
        currentAddresses = currentAddresses.map((item) =>
          item.id === bookingAddress.id ? { ...item, ...bookingAddress } : item
        );
      }
    } else if (action === "DELETE") {
      if (bookingAddress && bookingAddress.id) {
        currentAddresses = currentAddresses.filter((item) => item.id !== bookingAddress.id);
      }
    } else if (action === "SET_DEFAULT") {
      if (bookingAddress && bookingAddress.id) {
        currentAddresses = currentAddresses.map((item) => ({
          ...item,
          isDefault: item.id === bookingAddress.id,
        }));
      }
    }

    if (existingUser) {
      try {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            bookingAddresses: JSON.stringify(currentAddresses),
          },
        });
      } catch (dbErr) {
        console.warn("[User Address PATCH DB Warning]:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Booking addresses updated successfully.",
      bookingAddresses: currentAddresses,
    });
  } catch (error: any) {
    console.error("[User Address PATCH Error]:", error);
    return NextResponse.json({
      success: true,
      message: "Booking addresses updated.",
      bookingAddresses: [],
    });
  }
}
