import { NextResponse } from "next/server";
import {
  sendWhatsAppAlert,
  sendArtisanNewJobAlert,
  sendArtisanEscrowPayoutAlert,
  sendClientBookingConfirmedAlert,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipientPhone, recipientName, templateType, customMessage, customTitle } = body;

    if (!recipientPhone || recipientPhone.trim().length < 10) {
      return NextResponse.json(
        { error: "A valid Nigerian phone number (11 digits, e.g. 08031234567) is required." },
        { status: 400 }
      );
    }

    const targetName = recipientName || "Valued Partner";
    let dispatchResult: any = null;

    if (templateType === "CLIENT_BOOKING_CONFIRMED") {
      dispatchResult = await sendClientBookingConfirmedAlert({
        clientPhone: recipientPhone,
        clientName: targetName,
        serviceName: "AC Servicing & Gas Refill",
        bookingRef: `HHP-${Date.now().toString(36).toUpperCase()}`,
        amountNgn: 25000,
        scheduledDate: new Date().toLocaleDateString("en-NG", { dateStyle: "medium" }),
        scheduledTime: "10:00 AM",
        serviceAddress: "Plot 104, Aminu Kano Crescent, Wuse 2, Abuja",
      });
    } else if (templateType === "ARTISAN_NEW_JOB") {
      dispatchResult = await sendArtisanNewJobAlert({
        artisanPhone: recipientPhone,
        artisanName: targetName,
        serviceName: "Electrical Wiring & Distribution Box Repair",
        location: "Maitama District, Abuja (3.2 km away)",
        priceNgn: 35000,
        scheduledDate: new Date().toLocaleDateString("en-NG", { dateStyle: "medium" }),
        scheduledTime: "02:00 PM",
        bookingRef: `HHP-${Date.now().toString(36).toUpperCase()}`,
      });
    } else if (templateType === "ARTISAN_PAYOUT_CREDITED") {
      dispatchResult = await sendArtisanEscrowPayoutAlert({
        artisanPhone: recipientPhone,
        artisanName: targetName,
        serviceName: "Plumbing Leakage & Pipe Replacement",
        bookingRef: `HHP-${Date.now().toString(36).toUpperCase()}`,
        amountNgn: 45000,
        walletBalanceNgn: 120000,
      });
    } else {
      // General custom alert
      dispatchResult = await sendWhatsAppAlert({
        recipientPhone: recipientPhone,
        recipientName: targetName,
        title: customTitle || "System Notification",
        body: customMessage || "This is a live test notification from the HandyHub Pro SMS & WhatsApp Gateway Engine.",
        bookingRef: `HHP-${Date.now().toString(36).toUpperCase()}`,
        actionUrl: "https://handyhubpro.ng",
        actionLabel: "Open HandyHub Portal",
      });
    }

    return NextResponse.json({
      success: true,
      provider: dispatchResult?.provider || "simulator_logged",
      details: dispatchResult?.details || null,
      message: `Message dispatched successfully via provider: ${dispatchResult?.provider || "simulator"}!`,
    });
  } catch (error: any) {
    console.error("[Test Notification Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch test notification" },
      { status: 500 }
    );
  }
}
