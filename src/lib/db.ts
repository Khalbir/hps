import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  schemaEnsured?: boolean;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Self-Healing Schema Guard: Automatically adds missing columns to PostgreSQL
 */
export async function ensureUserSchema() {
  if (globalForPrisma.schemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permanentAddress" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permanentAddressProof" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permanentAddressStatus" TEXT DEFAULT 'NOT_SUBMITTED';
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permanentAddressNotes" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondaryAddress" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingPermanentAddress" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingPermanentAddressProof" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ninNumber" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ninStatus" TEXT DEFAULT 'NOT_SUBMITTED';
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bookingAddresses" TEXT DEFAULT '[]';
    `);
    globalForPrisma.schemaEnsured = true;
  } catch {
    // Graceful fallback if database user lacks ALTER permission or connection is offline
  }
}
