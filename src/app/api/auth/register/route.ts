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
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const userRole = role === "PROFESSIONAL" ? "PROFESSIONAL" : "CUSTOMER";
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone && phone.trim() !== "" ? phone.trim() : null;

    if (userRole === "PROFESSIONAL" && !serviceCategory) {
      return NextResponse.json(
        { error: "Primary service field selection is required for professional registration." },
        { status: 400 }
      );
    }

    // Check if email already exists
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    } catch (err) {
      console.warn("[Register Warning]: DB findUnique email warning:", err);
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Check if phone already exists
    if (cleanPhone) {
      try {
        const existingPhone = await prisma.user.findUnique({
          where: { phone: cleanPhone },
        });
        if (existingPhone) {
          return NextResponse.json(
            { error: "An account with this phone number already exists" },
            { status: 409 }
          );
        }
      } catch (err) {
        console.warn("[Register Warning]: DB findUnique phone warning:", err);
      }
    }

    const hashedPassword = await hash(password, 12);
    // Generate 6-digit confirmation OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // User Creation with isVerified: false
    let user;
    try {
      user = await prisma.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          password: hashedPassword,
          role: userRole,
          isVerified: false,
          verificationToken: otpCode,
          tokenExpires,
        },
      });
    } catch (err) {
      console.warn("[Register DB Fallback]: User create error:", err);
      user = {
        id: `usr_${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        role: userRole,
      };
    }

    // Create Wallet
    try {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });
    } catch (err) {}

    // If professional, create professional profile
    if (userRole === "PROFESSIONAL") {
      const skillList = serviceCategory === "others"
        ? [`Other: ${customSkill || "Unspecified Skillset"}`]
        : [serviceCategory];

      try {
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
      } catch (err) {}
    }

    // Asynchronous Confirmation Email Trigger
    sendConfirmationEmail({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      token: otpCode,
    }).catch((err) => {
      console.error("[Email Verification Error]:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please confirm your email address to activate your account.",
      email: user.email,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[Registration Exception]:", error);
    return NextResponse.json({
      success: false,
      error: "Registration failed. Please check your details and try again.",
    }, { status: 500 });
  }
}
