/**
 * Universal Deterministic Booking OTP Helper
 * Ensures Customer Track Screen, Pro Jobs Execution, and Database OTP Validation are 100% synchronized.
 */
export function getBookingOtp(booking: { reference?: string | null; id?: string | null; completionNote?: string | null } | null | undefined): string {
  if (!booking) return "4819";

  // 1. If explicitly stored in completionNote, use that
  if (booking.completionNote && booking.completionNote.trim().length >= 4) {
    return booking.completionNote.trim();
  }

  // 2. Check for reference structure (e.g. HHP_cleaning_1787099623017_7882 or HHP-7882)
  const ref = (booking.reference || booking.id || "").trim();
  if (ref) {
    const parts = ref.split(/[_-\s]+/);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (/^\d{4}$/.test(p)) {
        return p;
      }
    }

    // Extract last 4 continuous digits if available
    const digits = ref.replace(/\D/g, "");
    if (digits.length >= 4) {
      return digits.slice(-4);
    }
  }

  // 3. Fallback deterministic 4-digit numeric hash
  let hash = 0;
  const str = booking.reference || booking.id || "handyhub_otp_seed";
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 9000 + 1000).toString();
}
