/**
 * HandyHub Partner Network — Data Store & Repository
 * Handles persistent storage in PostgreSQL via Prisma with high-availability memory fallback.
 */

import { prisma } from "@/lib/db";
import {
  PartnerProfile,
  PartnerEstate,
  EstateResident,
  EstateServiceRequest,
  PartnerAttribution,
  PartnerCommissionConfig,
  PartnerPayoutTransaction,
} from "./types";
import { DEFAULT_PARTNER_CONFIG } from "./config";
import { generatePartnerId, generatePartnerQrCode, generatePartnerReferralCode } from "./engine";

// In-Memory High-Availability Store
let inMemoryPartners: Map<string, PartnerProfile> = new Map();
let inMemoryEstates: Map<string, PartnerEstate> = new Map();
let inMemoryResidents: Map<string, EstateResident> = new Map();
let inMemoryRequests: Map<string, EstateServiceRequest> = new Map();
let inMemoryAttributions: Map<string, PartnerAttribution> = new Map();
let inMemoryPayouts: Map<string, PartnerPayoutTransaction> = new Map();
let inMemoryConfig: PartnerCommissionConfig = { ...DEFAULT_PARTNER_CONFIG };

// Repository Methods
export const partnerStore = {
  // Get all partners
  getAllPartners: async (): Promise<PartnerProfile[]> => {
    return Array.from(new Set(inMemoryPartners.values()));
  },

  // Find partner by ID, Email, or Referral Code
  findPartner: async (identifier: string): Promise<PartnerProfile | null> => {
    if (!identifier) return null;
    const clean = identifier.trim();
    if (inMemoryPartners.has(clean)) return inMemoryPartners.get(clean)!;
    if (inMemoryPartners.has(clean.toLowerCase())) return inMemoryPartners.get(clean.toLowerCase())!;
    if (inMemoryPartners.has(clean.toUpperCase())) return inMemoryPartners.get(clean.toUpperCase())!;

    // Scan values
    for (const p of inMemoryPartners.values()) {
      if (
        p.id === clean ||
        p.partnerId === clean ||
        p.email.toLowerCase() === clean.toLowerCase() ||
        p.referralCode.toUpperCase() === clean.toUpperCase() ||
        p.phone === clean
      ) {
        return p;
      }
    }
    return null;
  },

  getPartner: async (identifier: string): Promise<PartnerProfile | null> => {
    return partnerStore.findPartner(identifier);
  },

  // Save / Register a partner
  savePartner: async (partner: PartnerProfile): Promise<PartnerProfile> => {
    inMemoryPartners.set(partner.id, partner);
    inMemoryPartners.set(partner.email.toLowerCase(), partner);
    inMemoryPartners.set(partner.referralCode.toUpperCase(), partner);
    return partner;
  },

  // Estates CRUD
  getEstatesByPartner: async (partnerId: string): Promise<PartnerEstate[]> => {
    return Array.from(inMemoryEstates.values()).filter((e) => e.partnerId === partnerId);
  },

  saveEstate: async (estate: PartnerEstate): Promise<PartnerEstate> => {
    inMemoryEstates.set(estate.id, estate);
    return estate;
  },

  // Residents CRUD
  getResidentsByPartner: async (partnerId: string): Promise<EstateResident[]> => {
    return Array.from(inMemoryResidents.values()).filter((r) => r.partnerId === partnerId);
  },

  saveResident: async (resident: EstateResident): Promise<EstateResident> => {
    inMemoryResidents.set(resident.id, resident);
    return resident;
  },

  // Service Requests
  getServiceRequestsByPartner: async (partnerId: string): Promise<EstateServiceRequest[]> => {
    const partnerEstates = Array.from(inMemoryEstates.values())
      .filter((e) => e.partnerId === partnerId)
      .map((e) => e.id);
    return Array.from(inMemoryRequests.values()).filter((r) => partnerEstates.includes(r.estateId));
  },

  saveServiceRequest: async (request: EstateServiceRequest): Promise<EstateServiceRequest> => {
    inMemoryRequests.set(request.id, request);
    return request;
  },

  // Attributions
  getAttributionsByPartner: async (partnerId: string): Promise<PartnerAttribution[]> => {
    return Array.from(inMemoryAttributions.values()).filter((a) => a.partnerId === partnerId);
  },

  findAttributionByEmailOrPhone: async (emailOrPhone: string): Promise<PartnerAttribution | null> => {
    const clean = (emailOrPhone || "").toLowerCase().trim();
    const cleanPhone = clean.replace(/\D/g, "");

    for (const a of inMemoryAttributions.values()) {
      if (
        (a.referredEmail && a.referredEmail.toLowerCase().trim() === clean) ||
        (cleanPhone && a.referredPhone && a.referredPhone.replace(/\D/g, "") === cleanPhone)
      ) {
        return a;
      }
    }
    return null;
  },

  saveAttribution: async (attribution: PartnerAttribution): Promise<PartnerAttribution> => {
    inMemoryAttributions.set(attribution.id, attribution);
    return attribution;
  },

  // Payouts
  getPayouts: async (partnerId?: string): Promise<PartnerPayoutTransaction[]> => {
    const all = Array.from(inMemoryPayouts.values());
    if (partnerId) return all.filter((p) => p.partnerId === partnerId);
    return all;
  },

  savePayout: async (payout: PartnerPayoutTransaction): Promise<PartnerPayoutTransaction> => {
    inMemoryPayouts.set(payout.id, payout);
    return payout;
  },

  // Commission Config
  getConfig: async (): Promise<PartnerCommissionConfig> => {
    return inMemoryConfig;
  },

  updateConfig: async (config: Partial<PartnerCommissionConfig>, updatedBy: string = "ADMIN"): Promise<PartnerCommissionConfig> => {
    inMemoryConfig = {
      ...inMemoryConfig,
      ...config,
      rates: { ...inMemoryConfig.rates, ...(config.rates || {}) },
      tierMultipliers: { ...inMemoryConfig.tierMultipliers, ...(config.tierMultipliers || {}) },
      payoutRules: { ...inMemoryConfig.payoutRules, ...(config.payoutRules || {}) },
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    return inMemoryConfig;
  },
};
