import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and Role are required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
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
