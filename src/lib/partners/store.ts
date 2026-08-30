/**
 * HandyHub Partner Network — Data Store & Repository
 * Handles persistent storage across Node/Serverless process boundaries backed by file storage & Prisma User synchronization.
 */

import fs from "fs";
import path from "path";
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

const DATA_DIR = path.join(process.cwd(), ".data");
const PARTNERS_STORE_PATH = path.join(DATA_DIR, "handyhub_partners.json");

interface PersistentPartnerData {
  partners: PartnerProfile[];
  estates: PartnerEstate[];
  residents: EstateResident[];
  requests: EstateServiceRequest[];
  attributions: PartnerAttribution[];
  payouts: PartnerPayoutTransaction[];
  config: PartnerCommissionConfig;
}

// In-Memory Global Reference for High-Speed Read Caching
const globalForPartners = globalThis as unknown as {
  partnerDataCache?: PersistentPartnerData;
};

function loadPersistentStore(): PersistentPartnerData {
  if (globalForPartners.partnerDataCache) {
    return globalForPartners.partnerDataCache;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(PARTNERS_STORE_PATH)) {
      const raw = fs.readFileSync(PARTNERS_STORE_PATH, "utf-8");
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        const data: PersistentPartnerData = {
          partners: Array.isArray(parsed.partners) ? parsed.partners : [],
          estates: Array.isArray(parsed.estates) ? parsed.estates : [],
          residents: Array.isArray(parsed.residents) ? parsed.residents : [],
          requests: Array.isArray(parsed.requests) ? parsed.requests : [],
          attributions: Array.isArray(parsed.attributions) ? parsed.attributions : [],
          payouts: Array.isArray(parsed.payouts) ? parsed.payouts : [],
          config: parsed.config ? { ...DEFAULT_PARTNER_CONFIG, ...parsed.config } : { ...DEFAULT_PARTNER_CONFIG },
        };
        globalForPartners.partnerDataCache = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("[Partners Store Read Warning]:", err);
  }

  const initial: PersistentPartnerData = {
    partners: [],
    estates: [],
    residents: [],
    requests: [],
    attributions: [],
    payouts: [],
    config: { ...DEFAULT_PARTNER_CONFIG },
  };
  savePersistentStore(initial);
  return initial;
}

function savePersistentStore(data: PersistentPartnerData) {
  globalForPartners.partnerDataCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PARTNERS_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Partners Store Write Warning]:", err);
  }
}

// Repository Methods
export const partnerStore = {
  // Get all partners (refreshes from disk to ensure cross-process consistency)
  getAllPartners: async (): Promise<PartnerProfile[]> => {
    // Invalidate memory cache on direct query to ensure latest disk state
    globalForPartners.partnerDataCache = undefined;
    const store = loadPersistentStore();
    return store.partners;
  },

  // Find partner by ID, Email, Referral Code, or Phone
  findPartner: async (identifier: string): Promise<PartnerProfile | null> => {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/\D/g, "");

    // Check store
    const store = loadPersistentStore();
    const match = store.partners.find(
      (p) =>
        p.id.toLowerCase() === clean ||
        p.partnerId.toLowerCase() === clean ||
        p.email.toLowerCase() === clean ||
        p.referralCode.toLowerCase() === clean ||
        (cleanPhone && p.phone && p.phone.replace(/\D/g, "") === cleanPhone)
    );

    if (match) return match;

    // Check directly by re-reading disk in case written by another worker process
    globalForPartners.partnerDataCache = undefined;
    const freshStore = loadPersistentStore();
    const freshMatch = freshStore.partners.find(
      (p) =>
        p.id.toLowerCase() === clean ||
        p.partnerId.toLowerCase() === clean ||
        p.email.toLowerCase() === clean ||
        p.referralCode.toLowerCase() === clean ||
        (cleanPhone && p.phone && p.phone.replace(/\D/g, "") === cleanPhone)
    );

    return freshMatch || null;
  },

  getPartner: async (identifier: string): Promise<PartnerProfile | null> => {
    return partnerStore.findPartner(identifier);
  },

  // Save / Register a partner
  savePartner: async (partner: PartnerProfile): Promise<PartnerProfile> => {
    globalForPartners.partnerDataCache = undefined;
    const store = loadPersistentStore();

    const idx = store.partners.findIndex(
      (p) => p.id === partner.id || p.email.toLowerCase() === partner.email.toLowerCase() || p.partnerId === partner.partnerId
    );

    if (idx >= 0) {
      store.partners[idx] = {
        ...store.partners[idx],
        ...partner,
        updatedAt: new Date().toISOString(),
      };
    } else {
      store.partners.push({
        ...partner,
        createdAt: partner.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    savePersistentStore(store);

    // Sync to User table in Prisma/Database so partner also exists as an authenticated platform user
    try {
      const [firstName, ...rest] = (partner.name || "").trim().split(" ");
      const lastName = rest.join(" ") || "Partner";
      await prisma.user.upsert({
        where: { email: partner.email.toLowerCase().trim() },
        create: {
          id: partner.userId || `usr_${partner.id}`,
          email: partner.email.toLowerCase().trim(),
          phone: partner.phone,
          firstName: firstName || "Partner",
          lastName,
          role: "PARTNER",
          permanentAddress: partner.address || undefined,
          isVerified: true,
          isActive: partner.status === "ACTIVE",
          password: "$2a$10$e8wJp5f5.dummy_hash_placeholder",
        },
        update: {
          phone: partner.phone,
          role: "PARTNER",
          isVerified: true,
          isActive: partner.status === "ACTIVE",
          permanentAddress: partner.address || undefined,
        },
      }).catch((e: any) => console.warn("[Partner DB User Upsert Warning]:", e));
    } catch (err) {
      console.warn("[Partner Sync Error]:", err);
    }

    return partner;
  },

  // Estates CRUD
  getEstatesByPartner: async (partnerId: string): Promise<PartnerEstate[]> => {
    const store = loadPersistentStore();
    return store.estates.filter((e) => e.partnerId === partnerId);
  },

  saveEstate: async (estate: PartnerEstate): Promise<PartnerEstate> => {
    globalForPartners.partnerDataCache = undefined;
    const store = loadPersistentStore();
    const idx = store.estates.findIndex((e) => e.id === estate.id);
    if (idx >= 0) {
      store.estates[idx] = { ...store.estates[idx], ...estate, updatedAt: new Date().toISOString() };
    } else {
      store.estates.push(estate);
    }
    savePersistentStore(store);
    return estate;
  },

  // Residents CRUD
  getResidentsByPartner: async (partnerId: string): Promise<EstateResident[]> => {
    const store = loadPersistentStore();
    return store.residents.filter((r) => r.partnerId === partnerId);
  },

  saveResident: async (resident: EstateResident): Promise<EstateResident> => {
    globalForPartners.partnerDataCache = undefined;
    const store = loadPersistentStore();
    const idx = store.residents.findIndex((r) => r.id === resident.id);
    if (idx >= 0) {
      store.residents[idx] = { ...store.residents[idx], ...resident };
    } else {
      store.residents.push(resident);
    }
    savePersistentStore(store);
    return resident;
  },

  // Service Requests
  getServiceRequestsByPartner: async (partnerId: string): Promise<EstateServiceRequest[]> => {
    const store = loadPersistentStore();
    const partnerEstates = store.estates.filter((e) => e.partnerId === partnerId).map((e) => e.id);
    return store.requests.filter((r) => partnerEstates.includes(r.estateId));
  },

  saveServiceRequest: async (request: EstateServiceRequest): Promise<EstateServiceRequest> => {
    globalForPartners.partnerDataCache = undefined;
    const store = loadPersistentStore();
    const idx = store.requests.findIndex((r) => r.id === request.id);
    if (idx >= 0) {
      store.requests[idx] = { ...store.requests[idx], ...request };
    } else {
      store.requests.push(request);
    }
    savePersistentStore(store);
    return request;
  },

  // Attributions
  getAttributionsByPartner: async (partnerId: string): Promise<PartnerAttribution[]> => {
    const store = loadPersistentStore();
    return store.attributions.filter((a) => a.partnerId === partnerId);
  },

  findAttributionByEmailOrPhone: async (emailOrPhone: string): Promise<PartnerAttribution | null> => {
    const clean = (emailOrPhone || "").toLowerCase().trim();
    const cleanPhone = clean.replace(/\D/g, "");
    const store = loadPersistentStore();

    for (const a of store.attributions) {
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
    globalForPartners.partnerDataCache = undefined;
    const store = loadPersistentStore();
    const idx = store.attributions.findIndex((a) => a.id === attribution.id);
    if (idx >= 0) {
      store.attributions[idx] = { ...store.attributions[idx], ...attribution };
    } else {
      store.attributions.push(attribution);
    }
    savePersistentStore(store);
    return attribution;
  },

  // Payouts
  getPayouts: async (partnerId?: string): Promise<PartnerPayoutTransaction[]> => {
    const store = loadPersistentStore();
    if (partnerId) return store.payouts.filter((p) => p.partnerId === partnerId);
    return store.payouts;
  },

  savePayout: async (payout: PartnerPayoutTransaction): Promise<PartnerPayoutTransaction> => {
    globalForPartners.partnerDataCache = undefined;
    const store = loadPersistentStore();
    const idx = store.payouts.findIndex((p) => p.id === payout.id);
    if (idx >= 0) {
      store.payouts[idx] = { ...store.payouts[idx], ...payout };
    } else {
      store.payouts.push(payout);
    }
    savePersistentStore(store);
    return payout;
  },

  // Commission Config
  getConfig: async (): Promise<PartnerCommissionConfig> => {
    const store = loadPersistentStore();
    return store.config;
  },

  updateConfig: async (config: Partial<PartnerCommissionConfig>, updatedBy: string = "ADMIN"): Promise<PartnerCommissionConfig> => {
    globalForPartners.partnerDataCache = undefined;
    const store = loadPersistentStore();
    store.config = {
      ...store.config,
      ...config,
      rates: { ...store.config.rates, ...(config.rates || {}) },
      tierMultipliers: { ...store.config.tierMultipliers, ...(config.tierMultipliers || {}) },
      payoutRules: { ...store.config.payoutRules, ...(config.payoutRules || {}) },
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    savePersistentStore(store);
    return store.config;
  },
};
