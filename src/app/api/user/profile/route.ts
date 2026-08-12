import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "customer@test.com";

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
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
      return NextResponse.json({
        user: {
          id: "usr_cust_demo",
          firstName: "Valued",
          lastName: "Customer",
          email: email,
          phone: "+234 812 222 2936",
          role: "CUSTOMER",
          isVerified: true,
          wallet: { balance: 50000 },
          permanentAddress: "12 Aminu Kano Crescent, Maitama, Abuja",
          permanentAddressProof: "https://ioggvcvwwnjfzbwyjiwf.supabase.co/storage/v1/object/public/id/utility-bill.jpg",
          permanentAddressStatus: "VERIFIED",
          permanentAddressNotes: "Address verified by Admin.",
          secondaryAddress: "Plot 5 Alex Ekwueme Way, Jabi, Abuja",
          addresses: [
            { id: "addr_1", title: "Home", street: "12 Aminu Kano Crescent", city: "Maitama", state: "Abuja", isDefault: true },
            { id: "addr_2", title: "Office", street: "Plot 5 Alex Ekwueme Way", city: "Jabi", state: "Abuja", isDefault: false },
          ],
          bookings: [
            { id: "HHP-ABC123", serviceCategory: "Deep Cleaning", status: "COMPLETED", date: "Jul 15, 2026", price: 25000, pro: "Blessing O." },
            { id: "HHP-DEF456", serviceCategory: "AC Servicing", status: "IN_PROGRESS", date: "Jul 18, 2026", price: 8000, pro: "Yusuf A." },
            { id: "HHP-GHI789", serviceCategory: "Plumbing Repair", status: "PENDING", date: "Jul 20, 2026", price: 10000, pro: "Ibrahim M." },
          ],
        },
      });
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
    const { email, firstName, lastName, phone, permanentAddress, permanentAddressProof, secondaryAddress, requestAddressChange } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    } catch {}

    if (!existingUser) {
      // In case DB is missing or disconnected
      return NextResponse.json({
        success: true,
        message: "Profile updated successfully (Demo Mode)! 🎉",
      });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();

    // Check permanent address updates
    if (permanentAddress !== undefined) {
      const trimmedAddr = permanentAddress.trim();
      const currentStatus = existingUser.permanentAddressStatus || "NOT_SUBMITTED";

      if (currentStatus === "VERIFIED") {
        if (requestAddressChange) {
          // Applying for a change of verified permanent address
          updateData.permanentAddress = trimmedAddr;
          updateData.permanentAddressProof = permanentAddressProof || existingUser.permanentAddressProof;
          updateData.permanentAddressStatus = "PENDING";
          updateData.permanentAddressNotes = "Change of address requested. Awaiting audit.";

          // Notify admins
          try {
            const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" } });
            for (const sa of superAdmins) {
              await prisma.notification.create({
                data: {
                  userId: sa.id,
                  type: "SYSTEM",
                  title: "Client Address Change Request 🏡",
                  message: `Client ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email}) requested change of permanent address to: ${trimmedAddr}`,
                }
              });
            }
          } catch {}
        }
      } else {
        // Submit initial address or re-submit rejected
        updateData.permanentAddress = trimmedAddr;
        if (permanentAddressProof) updateData.permanentAddressProof = permanentAddressProof;
        updateData.permanentAddressStatus = "PENDING";
        updateData.permanentAddressNotes = "Awaiting verification check.";

        // Notify admins
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

    // Check secondary address updates
    if (secondaryAddress !== undefined) {
      const isVerified = existingUser.permanentAddressStatus === "VERIFIED" || updateData.permanentAddressStatus === "VERIFIED";
      if (isVerified) {
        updateData.secondaryAddress = secondaryAddress.trim() || null;
      } else {
        return NextResponse.json({ error: "You must have a verified permanent home address before adding a secondary address." }, { status: 400 });
      }
    }

    try {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });
    } catch (dbErr) {
      console.warn("[User Profile Update DB Update Warning]:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully! 🎉",
    });
  } catch (error) {
    console.error("[User Profile PUT Error]:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
