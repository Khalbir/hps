import { NextResponse } from "next/server";
import { releaseEscrowPayout } from "@/lib/escrow";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, triggerSource, notes } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID or Reference is required" },
        { status: 400 }
      );
    }

    const result = await releaseEscrowPayout({
      bookingId,
      triggerSource: triggerSource || "ADMIN_RELEASE",
      notes: notes || "Escrow payout authorized",
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("[Escrow Release API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to release escrow payout" },
      { status: 500 }
    );
  }
}
