import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { cookies } from "next/headers";
import { generateDigitalIdFromSeed } from "@/lib/digitalId";

export const dynamic = "force-dynamic";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const userDataStr = cookieStore.get("handyhub_user_data")?.value;
    if (userDataStr) {
      return JSON.parse(userDataStr);
    }
  } catch (e) {
    console.warn("Failed to get requesting user from cookies:", e);
  }
  return null;
}

export async function GET() {
  try {
    // 1. Auto-reconcile orphan bookings and payments into User table
    try {
      const bookings = await prisma.booking.findMany({ select: { customerId: true, customer: { select: { email: true } } } }).catch(() => []);
      const payments = await prisma.payment.findMany({ select: { userId: true, user: { select: { email: true } } } }).catch(() => []);
      
      const existingUsers = await prisma.user.findMany({ select: { email: true } });
      const existingUserMap = new Set(existingUsers.map((u) => u.email.toLowerCase()));
      
      for (const b of bookings) {
        if (b.customer?.email && !existingUserMap.has(b.customer.email.toLowerCase())) {
          await prisma.user.create({
            data: {
              email: b.customer.email.toLowerCase().trim(),
              firstName: "Valued",
              lastName: "Customer",
              password: "$2a$10$e8wJp5f5.dummy_hash_placeholder",
              role: "CUSTOMER",
              isVerified: true,
            },
          }).catch(() => {});
          existingUserMap.add(b.customer.email.toLowerCase());
        }
      }

      for (const p of payments) {
        if (p.user?.email && !existingUserMap.has(p.user.email.toLowerCase())) {
          await prisma.user.create({
            data: {
              email: p.user.email.toLowerCase().trim(),
              firstName: "Valued",
              lastName: "Customer",
              password: "$2a$10$e8wJp5f5.dummy_hash_placeholder",
              role: "CUSTOMER",
              isVerified: true,
            },
          }).catch(() => {});
          existingUserMap.add(p.user.email.toLowerCase());
        }
      }
    } catch (reconcileErr) {
      console.warn("[Admin Users Reconcile Warning]:", reconcileErr);
    }

    // 2. Fetch all users directly from PostgreSQL database
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        professional: true,
      },
    });

    const formattedUsers = users.map((u) => {
      let resolvedStatus = (u.permanentAddressStatus || "").toUpperCase();
      if (!resolvedStatus || resolvedStatus === "NOT_SUBMITTED") {
        if (u.pendingPermanentAddress || u.pendingPermanentAddressProof || u.permanentAddressProof) {
          resolvedStatus = "PENDING";
        } else {
          resolvedStatus = "NOT_SUBMITTED";
        }
      }

      const isPro = u.role === "PROFESSIONAL" || Boolean(u.professional);
      const isStaff = u.role !== "CUSTOMER" && u.role !== "PROFESSIONAL";
      const effectiveRole = isStaff ? u.role : (isPro ? "PROFESSIONAL" : "CUSTOMER");

      return {
        id: u.id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0] || "User Account",
        email: u.email,
        phone: u.phone || "Not Provided",
        role: effectiveRole,
        isProfessional: isPro,
        digitalId: u.professional?.digitalId || (isPro ? "HHP-PRO-VERIFIED" : null),
        professionalStatus: u.professional?.verificationStatus || (isPro ? "VERIFIED" : null),
        isVerified: Boolean(u.isVerified || u.professional?.verificationStatus === "VERIFIED"),
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "Recent",
        permanentAddress: u.permanentAddress,
        permanentAddressProof: u.permanentAddressProof,
        permanentAddressStatus: resolvedStatus,
        permanentAddressNotes: u.permanentAddressNotes,
        secondaryAddress: u.secondaryAddress,
        pendingPermanentAddress: u.pendingPermanentAddress,
        pendingPermanentAddressProof: u.pendingPermanentAddressProof,
        bookingAddresses: u.bookingAddresses || "[]",
      };
    });

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error("[Admin Users GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

import { registerStaffAccount } from "@/lib/staff-registry";

// POST: Add or promote staff member by email (restricted to Chief Commander, Admin General can request)
export async function POST(request: Request) {
  try {
    const requester = await getRequestingUser();
    const requesterRole = requester?.role || "CUSTOMER";

    if (requesterRole !== "SUPER_ADMIN" && requesterRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Administrative role required." }, { status: 403 });
    }

    const body = await request.json();
    const { email, firstName, lastName, role, phone, password } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and designated Staff Role are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const initialPass = password && password.trim() ? password.trim() : "Staff123!";

    // If Admin General, seek request instead of executing
    if (requesterRole === "ADMIN") {
      // Find Chief Commanders (SUPER_ADMIN)
      const superAdmins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
      });

      for (const sa of superAdmins) {
        await prisma.notification.create({
          data: {
            userId: sa.id,
            type: "SYSTEM",
            title: "Staff Appointment Request 👤",
            message: `Admin General (${requester.email}) has requested to appoint ${firstName || ""} ${lastName || ""} (${cleanEmail}) as ${role}.`,
            data: JSON.stringify({ email: cleanEmail, firstName, lastName, role, phone }),
          },
        }).catch(() => {});
      }

      await prisma.auditLog.create({
        data: {
          userId: requester.id,
          action: "REQUEST_STAFF_APPOINTMENT",
          entity: "User",
          details: JSON.stringify({ email: cleanEmail, firstName, lastName, role, phone }),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        isRequest: true,
        message: `Appointment request for ${cleanEmail} as ${role} has been submitted to the Chief Commander for approval.`,
      });
    }

    // Chief Commander executes directly
    // Register into High-Availability Registry
    registerStaffAccount({
      email: cleanEmail,
      firstName,
      lastName,
      role,
      phone,
      password: initialPass,
    });

    let user: any = null;
    try {
      const hashedPassword = await hash(initialPass, 10);
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });

      if (user) {
        const updateData: any = {
          role,
          isVerified: true,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          phone: phone || user.phone,
        };
        if (password && password.trim()) {
          updateData.password = hashedPassword;
        }
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            firstName: firstName || "Staff",
            lastName: lastName || "Member",
            phone: phone || "+2349000000000",
            password: hashedPassword,
            role,
            isVerified: true,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[Admin Users POST DB Warning]: Failed DB write, relying on High-Availability Registry:", dbErr);
      user = { email: cleanEmail, firstName, lastName, role, isVerified: true };
    }

    await prisma.auditLog.create({
      data: {
        userId: requester.id,
        action: "APPOINT_STAFF",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ email: cleanEmail, role }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Staff member ${cleanEmail} successfully assigned role: ${role}`,
      user,
      initialPassword: initialPass,
    });
  } catch (error) {
    console.error("[Admin Users POST Error]:", error);
    return NextResponse.json({ error: "Failed to assign staff role" }, { status: 500 });
  }
}

// PUT: Change existing staff member role / password (restricted to Chief Commander, Admin General can request)
export async function PUT(request: Request) {
  try {
    const requester = await getRequestingUser();
    const requesterRole = requester?.role || "CUSTOMER";

    if (requesterRole !== "SUPER_ADMIN" && requesterRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Administrative role required." }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, password } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and Role are required" }, { status: 400 });
    }

    // If Admin General, seek request instead of executing
    if (requesterRole === "ADMIN") {
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      const targetName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}`.trim() : "Staff Member";
      const targetEmail = targetUser ? targetUser.email : `ID: ${userId}`;

      const superAdmins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
      });

      for (const sa of superAdmins) {
        await prisma.notification.create({
          data: {
            userId: sa.id,
            type: "SYSTEM",
            title: "Role Change Request 🔑",
            message: `Admin General (${requester.email}) has requested to change the role of ${targetName} (${targetEmail}) to ${role}.`,
            data: JSON.stringify({ userId, role, targetName, targetEmail }),
          },
        }).catch(() => {});
      }

      await prisma.auditLog.create({
        data: {
          userId: requester.id,
          action: "REQUEST_ROLE_CHANGE",
          entity: "User",
          entityId: userId,
          details: JSON.stringify({ role, targetEmail }),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        isRequest: true,
        message: `Role change request to reassign ${targetName} to ${role} has been submitted to the Chief Commander for approval.`,
      });
    }

    // Chief Commander executes directly
    let updatedUser: any = null;
    try {
      const existingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (existingUser) {
        registerStaffAccount({
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role,
          phone: existingUser.phone || undefined,
          password: password && password.trim() ? password.trim() : undefined,
        });

        const updateData: any = { role, isVerified: true };
        if (password && password.trim()) {
          updateData.password = await hash(password.trim(), 10);
        }

        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });

        if (role === "PROFESSIONAL") {
          const resolvedField = body.primaryField || body.field || "General Skilled Services";
          const skillsList = body.skills ? (Array.isArray(body.skills) ? body.skills : [body.skills]) : [resolvedField];

          await prisma.professional.upsert({
            where: { userId: existingUser.id },
            update: {
              verificationStatus: "VERIFIED",
              skills: JSON.stringify(skillsList),
            },
            create: {
              userId: existingUser.id,
              digitalId: generateDigitalIdFromSeed(existingUser.id),
              bio: `Verified Skilled Artisan in ${resolvedField}`,
              skills: JSON.stringify(skillsList),
              verificationStatus: "VERIFIED",
              rating: 4.5,
              totalJobs: 0,
            },
          }).catch(() => {});
        }
      }
    } catch (dbErr) {
      console.warn("[Admin Users PUT DB Warning]: DB update error, relying on High-Availability Registry:", dbErr);
      updatedUser = { id: userId, role, isVerified: true };
    }

    await prisma.auditLog.create({
      data: {
        userId: requester.id,
        action: "CHANGE_STAFF_ROLE",
        entity: "User",
        entityId: userId,
        details: JSON.stringify({ role }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role} successfully!`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("[Admin Users PUT Error]:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
