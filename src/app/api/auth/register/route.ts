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

    const hashedPassword = await hash(password, 12);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 1. Check if account already exists in database
    let existingUser = null;
    try {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ],
        },
      });
    } catch (err) {
      console.warn("[Register DB Find Error]:", err);
    }

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        if (existingUser.isVerified) {
          return NextResponse.json(
            { error: "An account with this email address already exists. Please log in to your account or reset your password." },
            { status: 400 }
          );
        } else {
          // Account exists but is unverified; update verification token and password, then resend email
          const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
          const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
          
          try {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                password: hashedPassword,
                phone: cleanPhone || existingUser.phone,
                role: userRole,
                verificationToken: newOtpCode,
                tokenExpires: newExpires,
              },
            });
          } catch (updErr) {
            console.error("[Register Update Unverified User Error]:", updErr);
          }

          sendConfirmationEmail({
            email: existingUser.email,
            name: `${firstName.trim()} ${lastName.trim()}`,
            role: userRole,
            token: newOtpCode,
          }).catch(() => {});

          return NextResponse.json({
            success: true,
            unverified: true,
            message: "An unverified account exists for this email. We've sent a new confirmation code to your inbox.",
            redirect: `/auth/verify-email?email=${encodeURIComponent(cleanEmail)}&role=${encodeURIComponent(userRole)}`,
            email: cleanEmail,
            role: userRole,
          });
        }
      } else if (cleanPhone && existingUser.phone === cleanPhone) {
        return NextResponse.json(
          { error: "An account with this phone number already exists. Please use a different phone number or sign in." },
          { status: 400 }
        );
      }
    }

    // 2. Create new user record in PostgreSQL database
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
    } catch (dbErr: any) {
      console.error("[Register DB Create Error]:", dbErr);
      // If creation failed due to phone unique constraint, retry without phone
      if (cleanPhone && (dbErr.code === "P2002" || String(dbErr).includes("phone"))) {
        try {
          user = await prisma.user.create({
            data: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: cleanEmail,
              phone: null,
              password: hashedPassword,
              role: userRole,
              isVerified: false,
              verificationToken: otpCode,
              tokenExpires,
            },
          });
        } catch (retryErr) {
          console.error("[Register DB Retry Error]:", retryErr);
          return NextResponse.json(
            { error: "Registration failed. An account with this email address may already exist." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Unable to create account. Please check your details and try again." },
          { status: 500 }
        );
      }
    }

    // Create Escrow Wallet
    try {
      await prisma.wallet.create({
        data: { userId: user.id, balance: 0 },
      });
    } catch (err) {}

    // If professional, create professional profile record
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

    // Send 6-Digit Email Confirmation Code & Verification Link
    sendConfirmationEmail({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      token: otpCode,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      message: "Account created! We've sent a 6-digit confirmation code and link to your email address.",
      redirect: `/auth/verify-email?email=${encodeURIComponent(cleanEmail)}&role=${encodeURIComponent(userRole)}`,
      email: cleanEmail,
      role: userRole,
    });
  } catch (error: any) {
    console.error("[Registration Exception]:", error);
    return NextResponse.json({
      error: "Registration failed. Please check your inputs and try again.",
    }, { status: 500 });
  }
}
