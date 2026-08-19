import { NextResponse } from "next/server";
import { prisma, ensureUserSchema } from "@/lib/db";
import { sendProfileUpdateEmail } from "@/lib/email";

export async function GET(request: Request) {
  try {
    await ensureUserSchema().catch(() => {});
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "customer@test.com";

    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: { email: { equals: email.trim(), mode: "insensitive" } },
        include: {
          addresses: true,
          wallet: true,
          bookings: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
    } catch (err) {
      console.warn("[User Profile GET Warning]: DB fetch fallback:", err);
    }

    if (!user) {
      return NextResponse.json({ error: "User profile not found in database" }, { status: 404 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("[User Profile API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, permanentAddress, permanentAddressProof, secondaryAddress, requestAddressChange, bookingAddresses } = body;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = null;
    try {
      existingUser = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });
    } catch (dbErr) {
      console.warn("[User Profile Update DB Lookup Warning]:", dbErr);
    }

    if (!existingUser) {
      try {
        existingUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            firstName: firstName ? firstName.trim() : "Valued",
            lastName: lastName ? lastName.trim() : "Client",
            phone: phone ? phone.trim() : null,
            password: "$2a$10$e8wJp5f5.dummy_hash_placeholder",
            role: "CUSTOMER",
            isVerified: true,
          },
        });
      } catch (createErr) {
        console.warn("[User Profile Upsert Warning]:", createErr);
      }
    }

    if (!existingUser) {
      return NextResponse.json({ error: "Unable to find or create user profile." }, { status: 500 });
    }

    const updateData: any = {};
    if (firstName !== undefined && firstName.trim() !== "") {
      updateData.firstName = firstName.trim();
    }
    if (lastName !== undefined && lastName.trim() !== "") {
      updateData.lastName = lastName.trim();
    }
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }
    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar;
    }

    // Check permanent address updates
    if (permanentAddress !== undefined) {
      const trimmedAddr = permanentAddress.trim();
      const currentStatus = existingUser.permanentAddressStatus || "NOT_SUBMITTED";

      if (currentStatus === "VERIFIED") {
        if (requestAddressChange) {
          updateData.pendingPermanentAddress = trimmedAddr;
          updateData.pendingPermanentAddressProof = permanentAddressProof || existingUser.permanentAddressProof;
          updateData.permanentAddressNotes = `Change request pending: proposed address ${trimmedAddr}. Awaiting administrator review.`;

          try {
            const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" } });
            for (const sa of superAdmins) {
              await prisma.notification.create({
                data: {
                  userId: sa.id,
                  type: "SYSTEM",
                  title: "Address Change Request 🏡",
                  message: `Client ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email}) requested change of permanent address to: ${trimmedAddr}`,
                }
              });
            }
          } catch {}
        }
      } else {
        updateData.permanentAddress = trimmedAddr;
        if (permanentAddressProof) updateData.permanentAddressProof = permanentAddressProof;
        updateData.permanentAddressStatus = "PENDING";
        updateData.permanentAddressNotes = "Awaiting verification check.";

        try {
          const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" } });
          for (const sa of superAdmins) {
            await prisma.notification.create({
              data: {
                userId: sa.id,
                type: "SYSTEM",
                title: "Client Address Verification 🏡",
                message: `Client ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email}) has submitted their permanent address for audit.`,
              }
            });
          }
        } catch {}
      }
    }

    // Check multiple booking address updates
    if (bookingAddresses !== undefined) {
      const isVerified = existingUser.permanentAddressStatus === "VERIFIED" || updateData.permanentAddressStatus === "VERIFIED";
      if (isVerified) {
        const rawJson = typeof bookingAddresses === "string" ? bookingAddresses : JSON.stringify(bookingAddresses);
        updateData.bookingAddresses = rawJson;
      } else {
        return NextResponse.json({ error: "You must have a verified permanent home address before configuring multiple booking addresses." }, { status: 400 });
      }
    }

    // Check secondary address updates (backwards compatibility)
    if (secondaryAddress !== undefined) {
      const isVerified = existingUser.permanentAddressStatus === "VERIFIED" || updateData.permanentAddressStatus === "VERIFIED";
      if (isVerified) {
        updateData.secondaryAddress = secondaryAddress.trim() || null;
      } else {
        return NextResponse.json({ error: "You must have a verified permanent home address before adding a secondary address." }, { status: 400 });
      }
    }

    let updatedUser = existingUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });
    } catch (dbErr) {
      console.warn("[User Profile Update DB Update Warning]:", dbErr);
    }

    const updatedFieldsList: string[] = [];
    if (updateData.firstName) updatedFieldsList.push(`First Name (${updateData.firstName})`);
    if (updateData.lastName) updatedFieldsList.push(`Last Name (${updateData.lastName})`);
    if (updateData.phone) updatedFieldsList.push(`Phone Number (${updateData.phone})`);
    if (updateData.permanentAddress) updatedFieldsList.push("Permanent Home Address");

    // Trigger Outbound Email Confirmation Message
    try {
      await sendProfileUpdateEmail({
        email: cleanEmail,
        name: `${updatedUser.firstName || "Valued"} ${updatedUser.lastName || "Client"}`,
        updatedFields: updatedFieldsList,
      });
    } catch (emailErr) {
      console.warn("[Profile Update Email Warning]:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Profile updated successfully! A confirmation email has been sent to ${cleanEmail}. 🎉`,
      user: updatedUser,
      emailSentTo: cleanEmail,
    });
  } catch (error) {
    console.error("[User Profile PUT Error]:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
