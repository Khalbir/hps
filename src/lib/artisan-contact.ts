/**
 * Artisan Direct Contact & Fallback Utility
 * Standardizes Nigerian phone numbers for WhatsApp direct chat, SMS text messages, and direct voice calls.
 */

export function cleanArtisanPhoneNumber(rawPhone?: string): {
  whatsappNumber: string;
  telNumber: string;
  displayNumber: string;
} {
  if (!rawPhone || typeof rawPhone !== "string" || !rawPhone.trim()) {
    return {
      whatsappNumber: "2348122222936",
      telNumber: "+2348122222936",
      displayNumber: "+234 812 222 2936",
    };
  }

  const digits = rawPhone.replace(/\D/g, "");

  let whatsappNumber = digits;
  if (whatsappNumber.startsWith("0")) {
    whatsappNumber = "234" + whatsappNumber.slice(1);
  } else if (!whatsappNumber.startsWith("234") && whatsappNumber.length === 10) {
    whatsappNumber = "234" + whatsappNumber;
  }

  if (!whatsappNumber || whatsappNumber.length < 10) {
    whatsappNumber = "2348122222936";
  }

  const telNumber = whatsappNumber.startsWith("234") ? `+${whatsappNumber}` : `+234${digits}`;
  const displayNumber = rawPhone.trim() || telNumber;

  return {
    whatsappNumber,
    telNumber,
    displayNumber,
  };
}

export function buildArtisanPrewrittenMessage(
  artisanName: string,
  bookingRef: string,
  serviceName?: string
): string {
  const cleanName = artisanName?.trim() || "Partner";
  const cleanRef = bookingRef?.trim() || "HandyHub Service";
  const cleanService = serviceName?.trim() ? ` (${serviceName.trim()})` : "";
  return `Hello ${cleanName}, I am reaching out regarding my HandyHub booking #${cleanRef}${cleanService}. Please confirm your arrival status.`;
}

export function getArtisanContactChannels(
  artisan: { name?: string; phone?: string },
  booking: { id?: string; reference?: string; serviceName?: string }
) {
  const artisanName = artisan?.name || "Assigned Artisan";
  const bookingRef = booking?.reference || booking?.id || "HHP-SERVICE";
  const serviceName = booking?.serviceName || "Property Service";

  const { whatsappNumber, telNumber, displayNumber } = cleanArtisanPhoneNumber(artisan?.phone);
  const prewrittenMessage = buildArtisanPrewrittenMessage(artisanName, bookingRef, serviceName);

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(prewrittenMessage)}`;
  const smsUrl = `sms:${telNumber}?body=${encodeURIComponent(prewrittenMessage)}`;
  const callUrl = `tel:${telNumber}`;
  const conciergeUrl = `https://wa.me/2348122222936?text=${encodeURIComponent(`Hello HandyHub Support! I need assistance reaching artisan ${artisanName} (${displayNumber}) for booking #${bookingRef}.`)}`;

  return {
    artisanName,
    bookingRef,
    serviceName,
    whatsappNumber,
    telNumber,
    displayNumber,
    prewrittenMessage,
    whatsappUrl,
    smsUrl,
    callUrl,
    conciergeUrl,
  };
}
