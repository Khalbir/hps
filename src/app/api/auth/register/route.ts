import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, phone, password, role, serviceCategory, customSkill } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const userRole = role === "PROFESSIONAL" ? "PROFESSIONAL" : "CUSTOMER";

    if (userRole === "PROFESSIONAL" && !serviceCategory) {
      return NextResponse.json(
        { error: "Primary service field selection is required for professional registration." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhone) {
        return NextResponse.json(
          { error: "An account with this phone number already exists" },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await hash(password, 12);
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        role: userRole,
        isVerified: false,
        verificationToken,
        tokenExpires,
      },
    });

    // Create wallet for new user
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    });

    // If professional, create profile with selected skills
    if (userRole === "PROFESSIONAL") {
      const skillList = serviceCategory === "others"
        ? [`Other: ${customSkill || "Unspecified Skillset"}`]
        : [serviceCategory];

      await prisma.professional.create({
        data: {
          userId: user.id,
          bio: serviceCategory === "others"
            ? `Custom Skillset Request: ${customSkill || "Unspecified"}`
            : `Verified ${serviceCategory} professional`,
          skills: JSON.stringify(skillList),
          verificationStatus: "PENDING",
        },
      });
    }

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Welcome to HandyHub Pro! 🎉",
        message: userRole === "PROFESSIONAL"
          ? serviceCategory === "others"
            ? "Your professional account has been created. Your skillset request is under review by our team."
            : "Your account has been created. Complete your profile verification to start receiving bookings."
          : "Your account has been created. Book your first service and get 50% off with code WELCOME50!",
      },
    });

    // Send confirmation email asynchronously
    sendConfirmationEmail({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      token: verificationToken,
    }).catch((err) => {
      console.error("[Email Verification Error]:", err);
    });

    return NextResponse.json({
      message: "Registration successful. Please verify your email.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[Registration Error]:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
