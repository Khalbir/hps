/**
 * HandyHub Partner Network — Data Store & Repository
 * Full PostgreSQL Database Persistence via Prisma with resilient JSON/RAM caching.
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
  PartnerCategory,
} from "./types";
import { DEFAULT_PARTNER_CONFIG } from "./config";
import { generatePartnerQrCode } from "./engine";

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

/**
 * Deserializes Partner Profile and nested records from a PostgreSQL User entity
 */
function parseUserPartnerData(u: any): {
  partner: PartnerProfile | null;
  estates: PartnerEstate[];
  residents: EstateResident[];
  requests: EstateServiceRequest[];
  attributions: PartnerAttribution[];
  payouts: PartnerPayoutTransaction[];
} {
  let partner: PartnerProfile | null = null;
  let estates: PartnerEstate[] = [];
  let residents: EstateResident[] = [];
  let requests: EstateServiceRequest[] = [];
  let attributions: PartnerAttribution[] = [];
  let payouts: PartnerPayoutTransaction[] = [];

  // 1. Parse secondaryAddress (PartnerProfile JSON payload)
  if (u.secondaryAddress) {
    try {
      const parsed = typeof u.secondaryAddress === "string" ? JSON.parse(u.secondaryAddress) : u.secondaryAddress;
      if (parsed && typeof parsed === "object" && (parsed.partnerId || parsed.category || parsed.referralCode)) {
        const partnerId = parsed.partnerId || `HHP-PTR-${Math.floor(10000 + Math.random() * 90000)}`;
        const referralCode = parsed.referralCode || `PTR-${(parsed.companyName || u.firstName || "PARTNER").toUpperCase().slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;
        const fullName = parsed.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0];

        partner = {
          id: parsed.id || `ptr_${u.id}`,
          partnerId,
          userId: u.id,
          name: fullName,
          companyName: parsed.companyName,
          email: u.email,
          phone: u.phone || parsed.phone || "",
          category: (parsed.category as PartnerCategory) || "ESTATE_MANAGER",
          operatingState: parsed.operatingState || "FCT",
          city: parsed.city || "Abuja",
          address: parsed.address || u.permanentAddress || "",
          referralCode,
          qrCodeUrl: parsed.qrCodeUrl || generatePartnerQrCode(`https://handyhubpro.ng/book?partner=${referralCode}`, (parsed.companyName || fullName).toUpperCase(), partnerId, referralCode),
          status: parsed.status || "ACTIVE",
          tierLevel: parsed.tierLevel || "BRONZE",
          walletBalance: Number(parsed.walletBalance || 0),
          totalEarnings: Number(parsed.totalEarnings || 0),
          totalWithdrawn: Number(parsed.totalWithdrawn || 0),
          bankName: parsed.bankName || "",
          bankAccount: parsed.bankAccount || "",
          accountName: parsed.accountName || fullName,
          bankCode: parsed.bankCode,
          notes: parsed.notes,
          createdAt: parsed.createdAt || (u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString()),
          updatedAt: parsed.updatedAt || (u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString()),
        };
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // 2. Synthesize if role is PARTNER but no JSON in secondaryAddress
  if (!partner && u.role === "PARTNER") {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0];
    const partnerId = `HHP-PTR-${Math.floor(10000 + Math.random() * 90000)}`;
    const referralCode = `PTR-${(u.firstName || "PARTNER").toUpperCase().slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;
    partner = {
      id: `ptr_${u.id}`,
      partnerId,
      userId: u.id,
      name: fullName,
      email: u.email,
      phone: u.phone || "",
      category: "ESTATE_MANAGER",
      operatingState: "FCT",
      city: "Abuja",
      address: u.permanentAddress || "",
      referralCode,
      qrCodeUrl: generatePartnerQrCode(`https://handyhubpro.ng/book?partner=${referralCode}`, fullName.toUpperCase(), partnerId, referralCode),
      status: "ACTIVE",
      tierLevel: "BRONZE",
      walletBalance: 0,
      totalEarnings: 0,
      totalWithdrawn: 0,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  // 3. Parse bookingAddresses (stores estates, residents, requests, payouts payload)
  if (u.bookingAddresses) {
    try {
      const parsedData = typeof u.bookingAddresses === "string" ? JSON.parse(u.bookingAddresses) : u.bookingAddresses;
      if (parsedData && typeof parsedData === "object") {
        if (Array.isArray(parsedData.estates)) estates = parsedData.estates;
        if (Array.isArray(parsedData.residents)) residents = parsedData.residents;
        if (Array.isArray(parsedData.requests)) requests = parsedData.requests;
        if (Array.isArray(parsedData.attributions)) attributions = parsedData.attributions;
        if (Array.isArray(parsedData.payouts)) payouts = parsedData.payouts;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return { partner, estates, residents, requests, attributions, payouts };
}

// Repository Methods
export const partnerStore = {
  // Get all partners across PostgreSQL and local store
  getAllPartners: async (): Promise<PartnerProfile[]> => {
    globalForPartners.partnerDataCache = undefined;
    const store = loadPersistentStore();
    const partnerMap = new Map<string, PartnerProfile>();

    // Add from local store
    for (const p of store.partners) {
      if (p.partnerId) partnerMap.set(p.partnerId.toUpperCase(), p);
      if (p.id) partnerMap.set(p.id, p);
      if (p.email) partnerMap.set(p.email.toLowerCase(), p);
    }

    // Query database for all PARTNER users
    try {
      const partnerUsers = await prisma.user.findMany({
        where: { role: "PARTNER" },
        orderBy: { createdAt: "desc" },
      }).catch(() => []);

      for (const u of partnerUsers) {
        const { partner, estates, residents } = parseUserPartnerData(u);
        if (partner) {
          partnerMap.set(partner.partnerId.toUpperCase(), partner);
          partnerMap.set(partner.id, partner);
          partnerMap.set(partner.email.toLowerCase(), partner);

          if (estates.length > 0) {
            for (const e of estates) {
              if (!store.estates.some((ex) => ex.id === e.id)) store.estates.push(e);
            }
          }
          if (residents.length > 0) {
            for (const r of residents) {
              if (!store.residents.some((rx) => rx.id === r.id)) store.residents.push(r);
            }
          }
        }
      }
    } catch (e) {
      console.warn("[Partner getAllPartners DB Warning]:", e);
    }

    const uniquePartners = Array.from(new Set(partnerMap.values()));
    store.partners = uniquePartners;
    savePersistentStore(store);
    return uniquePartners;
  },

  // Find partner by ID, Email, Referral Code, or Phone
  findPartner: async (identifier: string): Promise<PartnerProfile | null> => {
    if (!identifier) return null;
    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();
    const cleanUpper = clean.toUpperCase();
    const cleanPhone = clean.replace(/\D/g, "");

    // 1. Check in-memory / local disk cache
    const store = loadPersistentStore();
    const localMatch = store.partners.find(
      (p) =>
        p.id.toLowerCase() === cleanLower ||
        p.partnerId.toUpperCase() === cleanUpper ||
        p.email.toLowerCase() === cleanLower ||
        p.referralCode.toUpperCase() === cleanUpper ||
        (cleanPhone.length >= 7 && p.phone && p.phone.replace(/\D/g, "") === cleanPhone)
    );
    if (localMatch) return localMatch;

    // 2. Query PostgreSQL User & ReferralCode tables directly
    try {
      const dbUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { equals: cleanLower, mode: "insensitive" } },
            ...(cleanPhone.length >= 7 ? [{ phone: { contains: cleanPhone } }] : []),
            { role: "PARTNER" },
          ],
        },
      }).catch(() => []);

      for (const u of dbUsers) {
        const { partner, estates, residents, requests, payouts } = parseUserPartnerData(u);
        if (partner) {
          const matches =
            partner.id.toLowerCase() === cleanLower ||
            partner.partnerId.toUpperCase() === cleanUpper ||
            partner.email.toLowerCase() === cleanLower ||
            partner.referralCode.toUpperCase() === cleanUpper ||
            (cleanPhone.length >= 7 && partner.phone && partner.phone.replace(/\D/g, "") === cleanPhone);

          if (matches) {
            // Cache to memory and disk
            store.partners = store.partners.filter((p) => p.id !== partner.id && p.partnerId !== partner.partnerId);
            store.partners.push(partner);
            if (estates.length > 0) {
              store.estates = [...store.estates.filter((e) => e.partnerId !== partner.id), ...estates];
            }
            if (residents.length > 0) {
              store.residents = [...store.residents.filter((r) => r.partnerId !== partner.id), ...residents];
            }
            savePersistentStore(store);
            return partner;
          }
        }
      }

      // Check ReferralCode table
      const refCode = await prisma.referralCode.findFirst({
        where: { code: { equals: clean, mode: "insensitive" } },
        include: { user: true },
      }).catch(() => null);

      if (refCode?.user) {
        const { partner, estates, residents } = parseUserPartnerData(refCode.user);
        if (partner) {
          store.partners = store.partners.filter((p) => p.id !== partner.id && p.partnerId !== partner.partnerId);
          store.partners.push(partner);
          savePersistentStore(store);
          return partner;
        }
      }
    } catch (dbSearchErr) {
      console.warn("[Partner DB Lookup Warning]:", dbSearchErr);
    }

    return null;
  },

  getPartner: async (identifier: string): Promise<PartnerProfile | null> => {
    return partnerStore.findPartner(identifier);
  },

  // Save / Register a partner permanently across PostgreSQL and local store
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

    // Sync to User and ReferralCode tables in PostgreSQL
    try {
      const [firstName, ...rest] = (partner.name || "").trim().split(" ");
      const lastName = rest.join(" ") || (partner.companyName ? `(${partner.companyName})` : "Partner");

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: partner.email.toLowerCase().trim() },
            ...(partner.phone ? [{ phone: partner.phone.trim() }] : []),
          ],
        },
      }).catch(() => null);

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "PARTNER",
            phone: partner.phone || user.phone,
            permanentAddress: partner.address || user.permanentAddress,
            secondaryAddress: JSON.stringify(partner),
            isActive: partner.status === "ACTIVE",
            isVerified: true,
          },
        });
      } else {
        const userId = partner.userId || `usr_${partner.id}`;
        user = await prisma.user.create({
          data: {
            id: userId,
            email: partner.email.toLowerCase().trim(),
            phone: partner.phone || undefined,
            firstName: firstName || "Partner",
            lastName,
            role: "PARTNER",
            password: "$2a$10$e8wJp5f5.dummy_hash_placeholder",
            permanentAddress: partner.address || undefined,
            secondaryAddress: JSON.stringify(partner),
            bookingAddresses: JSON.stringify({ estates: [], residents: [], requests: [], payouts: [] }),
            isActive: partner.status === "ACTIVE",
            isVerified: true,
          },
        });
      }

      // Upsert ReferralCode
      if (user && partner.referralCode) {
        await prisma.referralCode.upsert({
          where: { code: partner.referralCode },
          create: {
            userId: user.id,
            code: partner.referralCode,
            qrPayload: `https://handyhubpro.ng/book?partner=${partner.referralCode}`,
            isActive: partner.status === "ACTIVE",
          },
          update: {
            isActive: partner.status === "ACTIVE",
          },
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("[Partner DB Sync Error]:", err);
    }

    return partner;
  },

  // Estates CRUD
  getEstatesByPartner: async (partnerId: string): Promise<PartnerEstate[]> => {
    const store = loadPersistentStore();
    const cleanLower = (partnerId || "").toLowerCase();
    const localEstates = store.estates.filter(
      (e) => e.partnerId.toLowerCase() === cleanLower || e.partnerId.toLowerCase() === `ptr_${cleanLower}`
    );
    if (localEstates.length > 0) return localEstates;

    // Check DB User bookingAddresses
    try {
      const partner = await partnerStore.findPartner(partnerId);
      if (partner?.email || partner?.userId) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(partner.userId ? [{ id: partner.userId }] : []),
              { email: partner.email.toLowerCase().trim() },
            ],
          },
        });
        if (user) {
          const { estates } = parseUserPartnerData(user);
          if (estates.length > 0) {
            for (const e of estates) {
              if (!store.estates.some((ex) => ex.id === e.id)) store.estates.push(e);
            }
            savePersistentStore(store);
            return estates;
          }
        }
      }
    } catch (e) {
      console.warn("[getEstatesByPartner DB Warning]:", e);
    }

    return localEstates;
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

    // Persist to User's bookingAddresses in DB
    try {
      const partner = await partnerStore.findPartner(estate.partnerId);
      if (partner?.email || partner?.userId) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(partner.userId ? [{ id: partner.userId }] : []),
              { email: partner.email.toLowerCase().trim() },
            ],
          },
        });
        if (user) {
          const { estates, residents, requests, attributions, payouts } = parseUserPartnerData(user);
          const eIdx = estates.findIndex((e) => e.id === estate.id);
          if (eIdx >= 0) {
            estates[eIdx] = { ...estates[eIdx], ...estate, updatedAt: new Date().toISOString() };
          } else {
            estates.push(estate);
          }
          await prisma.user.update({
            where: { id: user.id },
            data: {
              bookingAddresses: JSON.stringify({ estates, residents, requests, attributions, payouts }),
            },
          });
        }
      }
    } catch (dbEstateErr) {
      console.warn("[saveEstate DB Warning]:", dbEstateErr);
    }

    return estate;
  },

  // Residents CRUD
  getResidentsByPartner: async (partnerId: string): Promise<EstateResident[]> => {
    const store = loadPersistentStore();
    const cleanLower = (partnerId || "").toLowerCase();
    const localResidents = store.residents.filter(
      (r) => r.partnerId.toLowerCase() === cleanLower || r.partnerId.toLowerCase() === `ptr_${cleanLower}`
    );
    if (localResidents.length > 0) return localResidents;

    // Check DB User
    try {
      const partner = await partnerStore.findPartner(partnerId);
      if (partner?.email || partner?.userId) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(partner.userId ? [{ id: partner.userId }] : []),
              { email: partner.email.toLowerCase().trim() },
            ],
          },
        });
        if (user) {
          const { residents } = parseUserPartnerData(user);
          if (residents.length > 0) {
            for (const r of residents) {
              if (!store.residents.some((rx) => rx.id === r.id)) store.residents.push(r);
            }
            savePersistentStore(store);
            return residents;
          }
        }
      }
    } catch (e) {
      console.warn("[getResidentsByPartner DB Warning]:", e);
    }

    return localResidents;
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

    // Persist to User DB
    try {
      const partner = await partnerStore.findPartner(resident.partnerId);
      if (partner?.email || partner?.userId) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(partner.userId ? [{ id: partner.userId }] : []),
              { email: partner.email.toLowerCase().trim() },
            ],
          },
        });
        if (user) {
          const { estates, residents, requests, attributions, payouts } = parseUserPartnerData(user);
          const rIdx = residents.findIndex((r) => r.id === resident.id);
          if (rIdx >= 0) {
            residents[rIdx] = { ...residents[rIdx], ...resident };
          } else {
            residents.push(resident);
          }
          await prisma.user.update({
            where: { id: user.id },
            data: {
              bookingAddresses: JSON.stringify({ estates, residents, requests, attributions, payouts }),
            },
          });
        }
      }
    } catch (dbResidentErr) {
      console.warn("[saveResident DB Warning]:", dbResidentErr);
    }

    return resident;
  },

  // Service Requests
  getServiceRequestsByPartner: async (partnerId: string): Promise<EstateServiceRequest[]> => {
    const store = loadPersistentStore();
    const partnerEstates = (await partnerStore.getEstatesByPartner(partnerId)).map((e) => e.id);
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
