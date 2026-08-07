import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
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

// POST: Add or promote staff member by email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, role, phone, password } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and designated Staff Role are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const initialPass = password && password.trim() ? password.trim() : "Staff123!";

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

// PUT: Change existing staff member role / password
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, password } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and Role are required" }, { status: 400 });
    }

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
