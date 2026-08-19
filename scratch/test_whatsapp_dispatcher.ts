import {
  formatNigerianPhone,
  sendArtisanNewJobAlert,
  sendClientBookingConfirmedAlert,
  sendClientArtisanEnRouteAlert,
  sendClientCompletionOtpAlert,
  sendArtisanEscrowPayoutAlert,
} from "../src/lib/whatsapp";

async function testAll() {
  console.log("=== Testing Phone Normalization ===");
  console.log("08012345678 ->", formatNigerianPhone("08012345678"));
  console.log("+2348012345678 ->", formatNigerianPhone("+2348012345678"));
  console.log("2348012345678 ->", formatNigerianPhone("2348012345678"));
  console.log("09098765432 ->", formatNigerianPhone("09098765432"));
  console.log("8055551234 ->", formatNigerianPhone("8055551234"));

  console.log("\n=== Testing WhatsApp Alerts (Simulator Mode) ===");

  await sendArtisanNewJobAlert({
    artisanPhone: "08012345678",
    artisanName: "KHALID KABIR",
    serviceName: "Residential & Deep Cleaning",
    location: "Maitama District, Abuja FCT",
    priceNgn: 25000,
    scheduledDate: "Aug 19, 2026",
    scheduledTime: "10:00 AM",
    bookingRef: "HHP-TEST-7882",
  });

  await sendClientBookingConfirmedAlert({
    clientPhone: "08098765432",
    clientName: "Kabir Jauro",
    serviceName: "Residential & Deep Cleaning",
    bookingRef: "HHP-TEST-7882",
    amountNgn: 25000,
    scheduledDate: "Aug 19, 2026",
    scheduledTime: "10:00 AM",
    serviceAddress: "Plot 42, Gana Street, Maitama, Abuja",
  });

  await sendClientArtisanEnRouteAlert({
    clientPhone: "08098765432",
    clientName: "Kabir Jauro",
    artisanName: "KHALID KABIR",
    artisanPhone: "08012345678",
    digitalId: "HHP-PRO-27139",
    serviceName: "Residential & Deep Cleaning",
    bookingRef: "HHP-TEST-7882",
    etaMinutes: 20,
  });

  await sendClientCompletionOtpAlert({
    clientPhone: "08098765432",
    clientName: "Kabir Jauro",
    artisanName: "KHALID KABIR",
    serviceName: "Residential & Deep Cleaning",
    bookingRef: "HHP-TEST-7882",
    otpCode: "7882",
  });

  await sendArtisanEscrowPayoutAlert({
    artisanPhone: "08012345678",
    artisanName: "KHALID KABIR",
    bookingRef: "HHP-TEST-7882",
    serviceName: "Residential & Deep Cleaning",
    amountNgn: 22500,
    walletBalanceNgn: 97500,
  });

  console.log("\nAll WhatsApp alerts simulated successfully!");
}

testAll().catch(console.error);
