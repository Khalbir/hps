import { NextResponse } from "next/server";
import { initializeDualGatewayCheckout } from "@/lib/fintech";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amountNgn, bookingId, customerName, customerPhone, callbackUrl: customCallbackUrl, metadata } = body;

    if (!email || !amountNgn) {
      return NextResponse.json(
        { error: "Email and payment amount are required to initialize checkout" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // AUTO-RESOLUTION: Case-insensitive lookup for customer in PostgreSQL database
    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });
    } catch (dbErr) {
      console.warn("[Payment Init DB Warning]:", dbErr);
    }

    if (!dbUser) {
      // Create user record on the fly so authenticated dashboard users are never blocked
      try {
        const nameParts = (customerName || cleanEmail.split("@")[0]).split(" ");
        const firstName = nameParts[0] || "Client";
        const lastName = nameParts.slice(1).join(" ") || "";
        const dummyPassword = await hash("ClientPass123!", 10);

        dbUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            firstName,
            lastName,
            password: dummyPassword,
            phone: customerPhone || null,
            role: "CUSTOMER",
            isVerified: true,
          },
        });
        await prisma.wallet.create({ data: { userId: dbUser.id, balance: 0 } }).catch(() => {});
      } catch {
        // Fallback search again case-insensitively in case of race condition
        dbUser = await prisma.user.findFirst({
          where: { email: { equals: cleanEmail, mode: "insensitive" } },
        });
      }
    }

    const userId = dbUser?.id || `usr_${Date.now()}`;
    const sanitizedBookingId = bookingId ? String(bookingId).replace(/\s+/g, "_") : "BOOKING";
    const reference = `HHP_${sanitizedBookingId}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/$/, "") || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";
    
    // Dynamic callback URL resolution
    let finalCallbackUrl = customCallbackUrl;
    if (!finalCallbackUrl) {
      if (sanitizedBookingId.includes("TOPUP")) {
        finalCallbackUrl = `${origin}/dashboard/wallet?status=success&reference=${reference}`;
      } else {
        finalCallbackUrl = `${origin}/receipt/${reference}?status=success`;
      }
    }

    // Initialize Paystack primary checkout
    const checkout = await initializeDualGatewayCheckout({
      email: cleanEmail,
      amountNgn: Number(amountNgn),
      reference,
      callbackUrl: finalCallbackUrl,
      customerName: customerName || (dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : "HandyHub Client"),
      customerPhone: customerPhone || dbUser?.phone || undefined,
      bookingId: bookingId || undefined,
      metadata: {
        bookingId,
        email: cleanEmail,
        userId,
        customerName: customerName || (dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : "HandyHub Client"),
        ...(metadata || {}),
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: checkout.authorizationUrl,
      checkout,
      reference: checkout.reference,
      message: checkout.isFallback
        ? "Payment route initialized via Failover Gateway"
        : "Payment route initialized via Paystack Primary Gateway",
    });
  } catch (error: any) {
    console.error("[Payment Init REST API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error initializing payment gateway: " + (error.message || "") },
      { status: 500 }
    );
  }
}
