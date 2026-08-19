const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getBookingOtp(booking) {
  if (!booking) return "4819";

  if (booking.completionNote && booking.completionNote.trim().length >= 4) {
    return booking.completionNote.trim();
  }

  const ref = (booking.reference || booking.id || "").trim();
  if (ref) {
    const parts = ref.split(/[_-\s]+/);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (/^\d{4}$/.test(p)) {
        return p;
      }
    }

    const digits = ref.replace(/\D/g, "");
    if (digits.length >= 4) {
      return digits.slice(-4);
    }
  }

  let hash = 0;
  const str = booking.reference || booking.id || "handyhub_otp_seed";
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 9000 + 1000).toString();
}

async function run() {
  const bookings = await prisma.booking.findMany();
  console.log(`Found ${bookings.length} bookings to sync OTPs for.`);
  for (const b of bookings) {
    const otp = getBookingOtp(b);
    await prisma.booking.update({
      where: { id: b.id },
      data: { completionNote: otp }
    });
    console.log(`Synced Booking [${b.reference}] with Completion OTP: [${otp}]`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
