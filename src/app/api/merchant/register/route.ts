import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessName,
      contactFirstName,
      contactLastName,
      email,
      phone,
      password,
      cacNumber,
      businessAddress,
      city = "Abuja",
      state = "FCT",
      bankName,
      bankAccount,
      accountName,
      logoUrl,
      storePhotoUrl,
    } = body;

    if (!businessName || !email || !phone || !password || !businessAddress) {
      return NextResponse.json(
        { error: "Business name, email, phone, password, and physical address are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user or merchant already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { merchant: true },
    });
    if (existingUser?.merchant) {
      return NextResponse.json(
        { error: "A merchant account is already registered with this email address." },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password.trim(), 10);
    const slug = businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const finalSlug = `${slug}-${Date.now().toString().slice(-4)}`;

    // Create user & merchant profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        await tx.user.update({
          where: { id: userId },
          data: {
            cacNumber: cacNumber || existingUser.cacNumber,
            phone: phone || existingUser.phone,
          },
        });
      } else {
        const newUser = await tx.user.create({
          data: {
            email: cleanEmail,
            phone,
            firstName: contactFirstName || businessName,
            lastName: contactLastName || "Merchant",
            password: hashedPassword,
            role: "CUSTOMER", // User role; merchant capability is linked via Merchant model
            cacNumber,
            isVerified: true,
          },
        });
        userId = newUser.id;
      }

      const merchant = await tx.merchant.create({
        data: {
          userId,
          businessName,
          slug: finalSlug,
          cacNumber,
          businessAddress,
          city,
          state,
          phone,
          email: cleanEmail,
          bankName,
          bankAccount,
          accountName,
          logoUrl,
          storePhotoUrl,
          verificationStatus: "PENDING", // Pending Admin Audit
          subscriptionStatus: "PENDING_PAYMENT", // Requires Active ₦15,000/mo subscription
          subscriptionAmount: 15000,
        },
      });

      return { user: { id: userId, email: cleanEmail }, merchant };
    });

    return NextResponse.json({
      success: true,
      message: "Merchant account created successfully! Please proceed to complete monthly subscription.",
      merchant: result.merchant,
    });
  } catch (error: any) {
    console.error("[Merchant Register POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to register merchant" }, { status: 500 });
  }
}
