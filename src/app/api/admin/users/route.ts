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

// POST: Add or promote staff member by email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, role, phone } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and designated Staff Role are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role,
          isVerified: true,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          phone: phone || user.phone,
        },
      });
    } else {
      const tempHash = await hash(`StaffPassword_${Date.now()}`, 10);
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          firstName: firstName || "Staff",
          lastName: lastName || "Member",
          phone: phone || "+2349000000000",
          password: tempHash,
          role,
          isVerified: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Staff member ${user.email} successfully assigned role: ${role}`,
      user,
    });
  } catch (error) {
    console.error("[Admin Users POST Error]:", error);
    return NextResponse.json({ error: "Failed to assign staff role" }, { status: 500 });
  }
}

// PUT: Change existing staff member role
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and Role are required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role, isVerified: true },
    });

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
