import { NextResponse } from "next/server";
import { initializeDualGatewayCheckout } from "@/lib/fintech";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amountNgn, bookingId, customerName, customerPhone } = body;

    if (!email || !amountNgn) {
      return NextResponse.json(
        { error: "Email and payment amount are required to initialize checkout" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // STRICT ACCOUNT GATING: Verify customer exists in PostgreSQL database
    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    } catch (dbErr) {
      console.warn("[Payment Init DB Warning]:", dbErr);
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: "Only signed up or registered clients can make payments. Please log in or create an account to complete your booking." },
        { status: 401 }
      );
    }

    const reference = `HHP_${bookingId || "BKG"}_${Date.now()}`;
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/$/, "") || "http://localhost:3000";
    const callbackUrl = `${origin}/book?status=success`;

    // Dual-gateway checkout router (Paystack primary -> Flutterwave failover)
    const checkout = await initializeDualGatewayCheckout({
      email: cleanEmail,
      amountNgn: Number(amountNgn),
      reference,
      callbackUrl,
      customerName: customerName || `${dbUser.firstName} ${dbUser.lastName}`,
      customerPhone: customerPhone || dbUser.phone || undefined,
      metadata: { bookingId, email: cleanEmail, userId: dbUser.id },
    });

    return NextResponse.json({
      success: true,
      checkout,
      message: checkout.isFallback
        ? "Payment route initialized via Failover Gateway (Flutterwave)"
        : "Payment route initialized via Primary Gateway (Paystack)",
    });
  } catch (error) {
    console.error("[Payment Init REST API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error initializing payment gateway" },
      { status: 500 }
    );
  }
}
