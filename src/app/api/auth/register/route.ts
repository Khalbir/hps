import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { sendConfirmationEmail } from "@/lib/email";
import { storeCredential } from "@/lib/credentials-store";
import { generateDigitalIdFromSeed } from "@/lib/digitalId";
import { stateStore } from "@/lib/states/store";

export async function POST(request: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      serviceCategory,
      secondaryCategory,
      customSkill,
      idType,
      idNumber,
      operatingState,
      homeAddress,
      referralCode,
      partnerCode,
    } = await request.json();

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

    // Validate Operating State if provided
    if (operatingState && operatingState.trim()) {
      const isStateActive = await stateStore.isStateActive(operatingState);
      if (!isStateActive) {
        return NextResponse.json(
          {
            error: `HandyHub Pro operations in ${operatingState} are currently paused or in waitlist mode. Join the priority waitlist to be notified first!`,
            stateInactive: true,
            stateName: operatingState,
          },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hash(password, 12);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 1. Check if email already exists in database
    let existingUserByEmail = null;
    try {
      existingUserByEmail = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });
    } catch (err) {
      console.warn("[Register DB Email Find Error]:", err);
    }

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return NextResponse.json(
          { error: `An account with ${cleanEmail} already exists. Please log in to your account or reset your password.` },
          { status: 400 }
        );
      } else {
        // Account exists but is unverified; update verification token and password, then resend email
        const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        try {
          await prisma.user.update({
            where: { id: existingUserByEmail.id },
            data: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              password: hashedPassword,
              phone: cleanPhone || existingUserByEmail.phone,
              role: userRole,
              verificationToken: newOtpCode,
              tokenExpires: newExpires,
            },
          });
        } catch (updErr) {
          console.error("[Register Update Unverified User Error]:", updErr);
        }

        storeCredential(cleanEmail, password.trim(), {
          id: existingUserByEmail.id,
          email: cleanEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: userRole,
        });

        sendConfirmationEmail({
          email: existingUserByEmail.email,
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
    }

    // 2. Check if phone number already exists (only if valid numeric phone is provided)
    if (cleanPhone && /^\+?[0-9]{7,15}$/.test(cleanPhone)) {
      let existingUserByPhone = null;
      try {
        existingUserByPhone = await prisma.user.findFirst({
          where: { phone: cleanPhone },
        });
      } catch (err) {}

      if (existingUserByPhone && existingUserByPhone.email !== cleanEmail) {
        return NextResponse.json(
          { error: "An account with this phone number already exists. Please use a different phone number or log in." },
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
      const isP2002 = dbErr?.code === "P2002";
      const errTargets = Array.isArray(dbErr?.meta?.target) ? dbErr.meta.target.join(" ") : String(dbErr);

      if (isP2002 || errTargets.includes("email") || errTargets.includes("phone")) {
        // If email constraint failed or email exists
        if (errTargets.includes("email")) {
          return NextResponse.json(
            { error: `An account with ${cleanEmail} already exists. Please click 'Log In' to sign into your account or reset your password.` },
            { status: 400 }
          );
        }

        // If phone constraint failed, retry without phone if phone was provided
        if (cleanPhone && errTargets.includes("phone")) {
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
            return NextResponse.json(
              { error: `An account with ${cleanEmail} already exists. Please click 'Log In' to sign into your account.` },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: `An account with this email address (${cleanEmail}) already exists. Please log in or reset your password.` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `An account with ${cleanEmail} already exists. Please log in to your account.` },
          { status: 400 }
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
      const skillList: string[] = [];
      if (serviceCategory === "others") {
        skillList.push(`Other: ${customSkill || "Unspecified Skillset"}`);
      } else if (serviceCategory) {
        skillList.push(serviceCategory);
      }
      if (secondaryCategory && secondaryCategory !== serviceCategory) {
        skillList.push(secondaryCategory);
      }

      try {
        await prisma.professional.create({
          data: {
            userId: user.id,
            digitalId: generateDigitalIdFromSeed(user.id),
            bio: serviceCategory === "others"
              ? `Custom Skillset Request: ${customSkill || "Unspecified"}`
              : `Skilled ${serviceCategory}${secondaryCategory ? ` & ${secondaryCategory}` : ""} professional based in ${operatingState || "FCT Abuja"}`,
            skills: JSON.stringify(skillList),
            verificationStatus: "UNVERIFIED",
            idType: idType || "NIN",
            idNumber: idNumber || null,
            documents: JSON.stringify({
              serviceCategory,
              secondaryCategory: secondaryCategory || "",
              idType: idType || "NIN",
              idNumber: idNumber || "",
              operatingState: operatingState || "FCT Abuja",
              homeAddress: homeAddress || "",
            }),
          },
        });
      } catch (err) {}
    }

    storeCredential(cleanEmail, password.trim(), {
      id: user.id,
      email: cleanEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });

    // Record Partner Attribution if registered via partner referral link
    const effectivePartnerCode = referralCode || partnerCode;
    if (effectivePartnerCode) {
      try {
        const { partnerStore } = await import("@/lib/partners/store");
        const partner = await partnerStore.getPartner(effectivePartnerCode);
        if (partner) {
          await partnerStore.saveAttribution({
            id: `attr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            partnerId: partner.partnerId,
            referralCode: partner.referralCode,
            referredUserId: user.id,
            referredUserRole: userRole === "PROFESSIONAL" ? "PROFESSIONAL" : "CUSTOMER",
            referredName: `${user.firstName} ${user.lastName}`,
            referredEmail: cleanEmail,
            referredPhone: cleanPhone || undefined,
            attributionType: userRole === "PROFESSIONAL" ? "ARTISAN_RECRUIT" : partner.category === "ESTATE_MANAGER" ? "ESTATE_RESIDENT" : "ORGANIC_REFERRAL",
            totalJobs: 0,
            totalRevenueNgn: 0,
            totalCommissionEarnedNgn: 0,
            isPermanent: true,
            fraudScore: 0,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (pErr) {
        console.warn("[Register Partner Attribution Warn]:", pErr);
      }
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
      message: `Account created as ${userRole === "PROFESSIONAL" ? "Artisan / Professional" : "Client / Customer"}! We've sent a 6-digit confirmation code and link to your email address.`,
      redirect: `/auth/verify-email?email=${encodeURIComponent(cleanEmail)}&role=${encodeURIComponent(userRole)}`,
      email: cleanEmail,
      role: userRole,
      roleLabel: userRole === "PROFESSIONAL" ? "Artisan / Professional" : "Client / Customer",
      isProfessional: userRole === "PROFESSIONAL",
      canSwitchToClient: userRole === "PROFESSIONAL",
      canSwitchToPro: false,
    });
  } catch (error: any) {
    console.error("[Registration Exception]:", error);
    return NextResponse.json({
      error: "Registration failed. Please check your inputs and try again.",
    }, { status: 500 });
  }
}
