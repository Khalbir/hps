import { NextResponse } from "next/server";
import { stateStore } from "@/lib/states/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stateCode, stateName, fullName, email, phone, userType, city, lga, notes } = body;

    if (!email || !fullName || (!stateCode && !stateName)) {
      return NextResponse.json(
        { error: "Full Name, Email address, and Target State are required." },
        { status: 400 }
      );
    }

    const state = await stateStore.findState(stateCode || stateName);
    const resolvedCode = state ? state.code : (stateCode || "NG-GEN").toUpperCase();
    const resolvedName = state ? state.name : (stateName || "Nigeria");

    const entry = await stateStore.addWaitlistEntry({
      stateCode: resolvedCode,
      stateName: resolvedName,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      userType: userType || "CUSTOMER",
      city: city?.trim(),
      lga: lga?.trim(),
      notes: notes?.trim(),
    });

    return NextResponse.json({
      success: true,
      message: `You're on the priority waitlist for ${resolvedName}! We will notify you via ${email} with ₦5,000 in launch credits as soon as operations go live in your area.`,
      entry,
    });
  } catch (error: any) {
    console.error("[Waitlist API Error]:", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
