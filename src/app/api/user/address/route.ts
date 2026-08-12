import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseBookingAddresses } from "@/lib/verification/verification-service";
import { BookingAddressItem } from "@/lib/verification/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || searchParams.get("userId");

    if (!email) {
      return NextResponse.json({ error: "Email or userId is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { id: email }],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        permanentAddress: true,
        permanentAddressProof: true,
        permanentAddressStatus: true,
        permanentAddressNotes: true,
        pendingPermanentAddress: true,
        pendingPermanentAddressProof: true,
        bookingAddresses: true,
        isVerified: true,
        idVerified: true,
        ninNumber: true,
        ninStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Failed to fetch address information" }, { status: 500 });
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

    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          cleanEmail ? { email: cleanEmail } : undefined,
          userId ? { id: userId } : undefined,
        ].filter(Boolean) as any[],
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const trimmedAddr = permanentAddress.trim();
    const proofUrl = permanentAddressProof.trim();

    // Prevent direct submit if already VERIFIED; must use change request flow (PUT)
    if (existingUser.permanentAddressStatus === "VERIFIED") {
      return NextResponse.json(
        { error: "Your address is already verified. To change your address, submit an address change request." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        permanentAddress: trimmedAddr,
        permanentAddressProof: proofUrl,
        permanentAddressStatus: "PENDING",
        permanentAddressNotes: "Submitted for compliance audit. Pending administrator review.",
      },
    });

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

    return NextResponse.json({
      success: true,
      message: "Permanent address proof submitted successfully! Verification is now PENDING review.",
      user: {
        permanentAddress: updatedUser.permanentAddress,
        permanentAddressProof: updatedUser.permanentAddressProof,
        permanentAddressStatus: updatedUser.permanentAddressStatus,
      },
    });
  } catch (error: any) {
    console.error("[User Address POST Error]:", error);
    return NextResponse.json({ error: "Failed to submit address verification proof" }, { status: 500 });
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

    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          cleanEmail ? { email: cleanEmail } : undefined,
          userId ? { id: userId } : undefined,
        ].filter(Boolean) as any[],
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const trimmedProposed = proposedAddress.trim();
    const trimmedProof = proposedProofUrl.trim();

    // Preserve existing verified permanentAddress; store in pending fields
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        pendingPermanentAddress: trimmedProposed,
        pendingPermanentAddressProof: trimmedProof,
        permanentAddressNotes: `Address Change Request Pending: Proposed ${trimmedProposed}. Awaiting administrator approval.`,
      },
    });

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
            title: "Address Change Request Submitted 🏡",
            message: `Client ${existingUser.firstName} ${existingUser.lastName} requested permanent address update to: ${trimmedProposed}`,
          },
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Address change request submitted! Your existing verified address remains active while compliance audits the new location.",
      pendingPermanentAddress: updatedUser.pendingPermanentAddress,
      pendingPermanentAddressProof: updatedUser.pendingPermanentAddressProof,
    });
  } catch (error: any) {
    console.error("[User Address PUT Error]:", error);
    return NextResponse.json({ error: "Failed to submit address change request" }, { status: 500 });
  }
}

// PATCH: Manage Multiple Booking Addresses (Home, Office, Construction Site - NO PROOF REQUIRED)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { email, userId, action, bookingAddress } = body;
    // action: "ADD" | "EDIT" | "DELETE" | "SET_DEFAULT"

    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          cleanEmail ? { email: cleanEmail } : undefined,
          userId ? { id: userId } : undefined,
        ].filter(Boolean) as any[],
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const isVerified = existingUser.permanentAddressStatus === "VERIFIED";

    let currentAddresses = parseBookingAddresses(existingUser.bookingAddresses);

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
      if (!bookingAddress || !bookingAddress.id) {
        return NextResponse.json({ error: "Address ID is required for editing." }, { status: 400 });
      }
      currentAddresses = currentAddresses.map((item) =>
        item.id === bookingAddress.id ? { ...item, ...bookingAddress } : item
      );
    } else if (action === "DELETE") {
      if (!bookingAddress || !bookingAddress.id) {
        return NextResponse.json({ error: "Address ID is required for deletion." }, { status: 400 });
      }
      currentAddresses = currentAddresses.filter((item) => item.id !== bookingAddress.id);
    } else if (action === "SET_DEFAULT") {
      if (!bookingAddress || !bookingAddress.id) {
        return NextResponse.json({ error: "Address ID is required." }, { status: 400 });
      }
      currentAddresses = currentAddresses.map((item) => ({
        ...item,
        isDefault: item.id === bookingAddress.id,
      }));
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        bookingAddresses: JSON.stringify(currentAddresses),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Booking addresses updated successfully.",
      bookingAddresses: currentAddresses,
    });
  } catch (error: any) {
    console.error("[User Address PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update booking addresses" }, { status: 500 });
  }
}
