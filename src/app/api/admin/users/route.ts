import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { purgeDemoRecordsFromDB, DEMO_EMAILS } from "@/lib/purge-demo-utility";
import { cookies } from "next/headers";

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

export async function GET(request: Request) {
  try {
    await purgeDemoRecordsFromDB();

    const users = await prisma.user.findMany({
      where: {
        email: { notIn: DEMO_EMAILS },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "User Account",
      email: u.email,
      phone: u.phone || "Not Provided",
      role: u.role,
      isVerified: u.isVerified,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "Recent",
    }));

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
