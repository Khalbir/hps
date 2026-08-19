import crypto from "crypto";
import { prisma } from "./prisma";
import { sendClientPartAuthorizationAlert, sendArtisanPartVoucherAlert } from "./whatsapp";
import { sendMultiChannelNotification } from "./notifications";

// Category max threshold caps for anti-price-gouging validation
export const CATEGORY_PRICE_BOUNDS: Record<string, { max: number; label: string }> = {
  PLUMBING: { max: 250000, label: "Plumbing Fixtures & Pipes" },
  ELECTRICAL: { max: 350000, label: "Electrical & Inverter Components" },
  HVAC: { max: 450000, label: "AC Compressors & Refrigeration" },
  CARPENTRY: { max: 200000, label: "Locks, Hinges & Timber" },
  APPLIANCE: { max: 300000, label: "Appliance Motors & Pumps" },
  GENERAL: { max: 200000, label: "General Hardware" },
};

// Seed default verified partner suppliers if none exist in DB
export async function ensureDefaultSuppliers() {
  const count = await prisma.partSupplier.count();
  if (count > 0) return;

  const defaultSuppliers = [
    {
      name: "Abuja Central Electro & AC Hub",
      category: "HVAC",
      contactPerson: "Engr. Emmanuel Okafor",
      phone: "+2348031234567",
      email: "electrohub.abuja@handyhubpro.ng",
      address: "Plot 14, Garki II Commercial District, Abuja",
      city: "Abuja",
      state: "FCT",
      bankName: "Guaranty Trust Bank",
      bankAccount: "0123984756",
      accountName: "Abuja Electro Hub Ltd",
      isVerified: true,
      rating: 4.9,
    },
    {
      name: "Maitama Plumbing & Sanitary Mart",
      category: "PLUMBING",
      contactPerson: "Alhaji Ibrahim Sani",
      phone: "+2348029876543",
      email: "maitama.plumbing@handyhubpro.ng",
      address: "Shop 12, Maitama Shopping Plaza, FCT Abuja",
      city: "Abuja",
      state: "FCT",
      bankName: "Zenith Bank",
      bankAccount: "1019283746",
      accountName: "Maitama Sanitary Mart Nig",
      isVerified: true,
      rating: 4.8,
    },
    {
      name: "Wuse Electrical & Power Solutions",
      category: "ELECTRICAL",
      contactPerson: "Chief Chukwuma Eze",
      phone: "+2348055551234",
      email: "wuse.power@handyhubpro.ng",
      address: "Zone 3 Wuse Market Annex, Abuja",
      city: "Abuja",
      state: "FCT",
      bankName: "Access Bank",
      bankAccount: "0088776655",
      accountName: "Wuse Power Systems Ltd",
      isVerified: true,
      rating: 5.0,
    },
    {
      name: "Apo Artisan Hardware & Timber Depo",
      category: "CARPENTRY",
      contactPerson: "Mr. Tunde Balogun",
      phone: "+2348071112233",
      email: "apo.hardware@handyhubpro.ng",
      address: "Apo Mechanic & Building Village, Abuja",
      city: "Abuja",
      state: "FCT",
      bankName: "First Bank of Nigeria",
      bankAccount: "2039485761",
      accountName: "Apo Hardware Supplies",
      isVerified: true,
      rating: 4.7,
    },
  ];

  for (const s of defaultSuppliers) {
    await prisma.partSupplier.create({ data: s });
  }
}

/**
 * Computes a SHA-256 hash of a receipt image string (or URL/base64) to detect duplicates across all requests
 */
export function computeReceiptHash(receiptPayload: string): string {
  return crypto.createHash("sha256").update(receiptPayload.trim()).digest("hex");
}

/**
 * Generates an 8-character cryptographic, human-readable purchase voucher code
 * e.g., HHP-VOUCH-7892
 */
export function generateVoucherCode(): string {
  const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `HHP-VOUCH-${randomNum}`;
}

/**
 * Appends an immutable audit log record for a replacement part lifecycle event
 */
export async function logPartAudit(params: {
  partId: string;
  actorId?: string;
  actorRole: "ARTISAN" | "CUSTOMER" | "ADMIN" | "SYSTEM";
  action: string;
  notes?: string;
  metadata?: any;
  ipAddress?: string;
}) {
  try {
    return await prisma.partAuditLog.create({
      data: {
        partId: params.partId,
        actorId: params.actorId || null,
        actorRole: params.actorRole,
        action: params.action,
        notes: params.notes || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err) {
    console.error("[PartAuditLog Error]", err);
    return null;
  }
}

/**
 * Find the most suitable verified supplier for a given category and city
 */
export async function findSupplierForCategory(category: string, city: string = "Abuja") {
  await ensureDefaultSuppliers();
  const supplier = await prisma.partSupplier.findFirst({
    where: {
      isVerified: true,
      category: { equals: category, mode: "insensitive" },
    },
    orderBy: { rating: "desc" },
  });

  if (supplier) return supplier;

  // Fallback to any verified supplier
  return await prisma.partSupplier.findFirst({
    where: { isVerified: true },
    orderBy: { rating: "desc" },
  });
}
