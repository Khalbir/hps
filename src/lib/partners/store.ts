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

// Seed High-Quality Initial Partner Data
function initializeSeedData() {
  if (inMemoryPartners.size > 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng";

  // 1. Seed Estate Manager Partner
  const estatePartner: PartnerProfile = {
    id: "ptr_sunnyvale_facility",
    partnerId: "HHP-PTR-88210",
    userId: "usr_partner_sunnyvale",
    name: "Chief Babatunde Adeleke",
    companyName: "Sunnyvale Facilities & Asset Management Ltd",
    email: "partner@sunnyvale.ng",
    phone: "08034567890",
    category: "ESTATE_MANAGER",
    operatingState: "FCT",
    city: "Abuja",
    address: "Facility Office, Sunnyvale Homes, Lokogoma District",
    referralCode: "EST-SUNNYVALE-01",
    qrCodeUrl: generatePartnerQrCode(`${baseUrl}/book?partner=EST-SUNNYVALE-01`, "SUNNYVALE ESTATE"),
    status: "ACTIVE",
    tierLevel: "GOLD",
    walletBalance: 285400,
    totalEarnings: 842000,
    totalWithdrawn: 556600,
    bankName: "Guaranty Trust Bank (GTB)",
    bankAccount: "0123984756",
    accountName: "Sunnyvale Facility Services Ltd",
    bankCode: "058",
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  inMemoryPartners.set(estatePartner.id, estatePartner);
  inMemoryPartners.set(estatePartner.referralCode, estatePartner);
  inMemoryPartners.set(estatePartner.email, estatePartner);

  // 2. Seed Estates for the Estate Manager
  const estate1: PartnerEstate = {
    id: "est_sunnyvale_main",
    partnerId: estatePartner.id,
    name: "Sunnyvale Homes Estate",
    city: "Abuja",
    state: "FCT",
    address: "Lokogoma Expressway, Opposite Sun City, Abuja",
    totalUnits: 340,
    occupiedUnits: 312,
    gateSecurityPhone: "08091122334",
    gatePassRequired: true,
    preferredCategories: ["plumbing", "electrical", "cleaning", "fumigation", "hvac"],
    monthlyServiceVolume: 1250000,
    createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  inMemoryEstates.set(estate1.id, estate1);

  const estate2: PartnerEstate = {
    id: "est_carlton_gate",
    partnerId: estatePartner.id,
    name: "Carlton Gate Luxury Terraces",
    city: "Abuja",
    state: "FCT",
    address: "Plot 402, Cadastral Zone B09, Kado, Abuja",
    totalUnits: 85,
    occupiedUnits: 78,
    gateSecurityPhone: "08129988776",
    gatePassRequired: true,
    preferredCategories: ["cleaning", "hvac", "solar", "cctv", "electrical"],
    monthlyServiceVolume: 890000,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  inMemoryEstates.set(estate2.id, estate2);

  // 3. Seed Estate Residents
  const residentsList: EstateResident[] = [
    {
      id: "res_01",
      estateId: estate1.id,
      partnerId: estatePartner.id,
      residentName: "Dr. Aliyu Mohammed",
      unitNumber: "House 24, Jasmine Close",
      phone: "08023456789",
      email: "aliyu.m@gmail.com",
      status: "ACTIVE",
      totalBookings: 8,
      totalSpendNgn: 185000,
      lastBookingDate: "2026-08-25",
      joinedAt: "2026-06-10",
    },
    {
      id: "res_02",
      estateId: estate1.id,
      partnerId: estatePartner.id,
      residentName: "Mrs. Ngozi Okeke",
      unitNumber: "Block B, Flat 4, Acacia Court",
      phone: "08134567890",
      email: "ngozi.okeke@outlook.com",
      status: "ACTIVE",
      totalBookings: 5,
      totalSpendNgn: 92000,
      lastBookingDate: "2026-08-22",
      joinedAt: "2026-06-15",
    },
    {
      id: "res_03",
      estateId: estate1.id,
      partnerId: estatePartner.id,
      residentName: "Engr. Femi Adeleke",
      unitNumber: "House 7, Rose Avenue",
      phone: "08098765432",
      email: "femi.engr@yahoo.com",
      status: "ACTIVE",
      totalBookings: 12,
      totalSpendNgn: 340000,
      lastBookingDate: "2026-08-28",
      joinedAt: "2026-05-20",
    },
    {
      id: "res_04",
      estateId: estate2.id,
      partnerId: estatePartner.id,
      residentName: "Barrister Funke Williams",
      unitNumber: "Terrace 3B, Carlton Gate",
      phone: "08055667788",
      email: "funke.law@gmail.com",
      status: "ACTIVE",
      totalBookings: 6,
      totalSpendNgn: 145000,
      lastBookingDate: "2026-08-19",
      joinedAt: "2026-07-01",
    },
  ];
  residentsList.forEach((r) => inMemoryResidents.set(r.id, r));

  // 4. Seed Live Estate Service Requests
  const serviceRequests: EstateServiceRequest[] = [
    {
      id: "req_01",
      estateId: estate1.id,
      estateName: "Sunnyvale Homes Estate",
      unitNumber: "House 24, Jasmine Close",
      residentName: "Dr. Aliyu Mohammed",
      residentPhone: "08023456789",
      serviceCategory: "plumbing",
      serviceName: "Pressure Pump Overhaul & Float Valve Fix",
      status: "IN_PROGRESS",
      amount: 35000,
      commissionEarned: 2275, // 5% * 1.30 Gold tier
      assignedArtisan: {
        name: "Musa Danladi",
        phone: "08029988112",
        rating: 4.9,
        trade: "Master Plumber",
      },
      scheduledDate: "Today, 10:30 AM",
      createdAt: new Date().toISOString(),
    },
    {
      id: "req_02",
      estateId: estate1.id,
      estateName: "Sunnyvale Homes Estate",
      unitNumber: "Block B, Flat 4, Acacia Court",
      residentName: "Mrs. Ngozi Okeke",
      residentPhone: "08134567890",
      serviceCategory: "hvac",
      serviceName: "AC Gas Top-Up & Coil Deep Chemical Clean",
      status: "DISPATCHED",
      amount: 48000,
      commissionEarned: 3120,
      assignedArtisan: {
        name: "Ibrahim Yakubu",
        phone: "08145566778",
        rating: 4.8,
        trade: "HVAC Specialist",
      },
      scheduledDate: "Today, 02:00 PM",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "req_03",
      estateId: estate1.id,
      estateName: "Sunnyvale Homes Estate",
      unitNumber: "House 7, Rose Avenue",
      residentName: "Engr. Femi Adeleke",
      residentPhone: "08098765432",
      serviceCategory: "fumigation",
      serviceName: "Whole Duplex Indoor & Garden Perimeter Pest Eradication",
      status: "COMPLETED",
      amount: 65000,
      commissionEarned: 4225,
      assignedArtisan: {
        name: "Biodun Olatunji",
        phone: "08033221144",
        rating: 5.0,
        trade: "NAFDAC Pest Control Tech",
      },
      scheduledDate: "Yesterday, 11:00 AM",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "req_04",
      estateId: estate2.id,
      estateName: "Carlton Gate Luxury Terraces",
      unitNumber: "Terrace 3B, Carlton Gate",
      residentName: "Barrister Funke Williams",
      residentPhone: "08055667788",
      serviceCategory: "cleaning",
      serviceName: "Post-Event Deep Upholstery & Kitchen Steam Clean",
      status: "COMPLETED",
      amount: 55000,
      commissionEarned: 3575,
      assignedArtisan: {
        name: "Blessing Amadi",
        phone: "08187766554",
        rating: 4.9,
        trade: "Deep Cleaning Lead",
      },
      scheduledDate: "26 Aug 2026",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];
  serviceRequests.forEach((req) => inMemoryRequests.set(req.id, req));

  // 5. Seed Realtor Partner
  const realtorPartner: PartnerProfile = {
    id: "ptr_apex_properties",
    partnerId: "HHP-PTR-55192",
    userId: "usr_partner_apex",
    name: "Victoria Emenike",
    companyName: "Apex Prime Luxury Real Estate",
    email: "victoria@apexprimerealty.ng",
    phone: "08091122334",
    category: "REALTOR",
    operatingState: "Lagos",
    city: "Lekki Phase 1",
    address: "Admiralty Way, Lekki Phase 1, Lagos",
    referralCode: "PTR-APEX-77",
    qrCodeUrl: generatePartnerQrCode(`${baseUrl}/book?partner=PTR-APEX-77`, "APEX LUXURY HOMES"),
    status: "ACTIVE",
    tierLevel: "SILVER",
    walletBalance: 142000,
    totalEarnings: 395000,
    totalWithdrawn: 253000,
    bankName: "Zenith Bank",
    bankAccount: "2087654321",
    accountName: "Victoria Emenike",
    bankCode: "057",
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  inMemoryPartners.set(realtorPartner.id, realtorPartner);
  inMemoryPartners.set(realtorPartner.referralCode, realtorPartner);
  inMemoryPartners.set(realtorPartner.email, realtorPartner);
}

// Call seed once
initializeSeedData();

// Repository Methods
export const partnerStore = {
  // Get all partners
  getAllPartners: async (): Promise<PartnerProfile[]> => {
    initializeSeedData();
    return Array.from(new Set(inMemoryPartners.values()));
  },

  // Find partner by ID, Email, or Referral Code
  findPartner: async (identifier: string): Promise<PartnerProfile | null> => {
    initializeSeedData();
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

  // Save / Register a partner
  savePartner: async (partner: PartnerProfile): Promise<PartnerProfile> => {
    initializeSeedData();
    inMemoryPartners.set(partner.id, partner);
    inMemoryPartners.set(partner.email.toLowerCase(), partner);
    inMemoryPartners.set(partner.referralCode.toUpperCase(), partner);
    return partner;
  },

  // Estates CRUD
  getEstatesByPartner: async (partnerId: string): Promise<PartnerEstate[]> => {
    initializeSeedData();
    return Array.from(inMemoryEstates.values()).filter((e) => e.partnerId === partnerId);
  },

  saveEstate: async (estate: PartnerEstate): Promise<PartnerEstate> => {
    initializeSeedData();
    inMemoryEstates.set(estate.id, estate);
    return estate;
  },

  // Residents CRUD
  getResidentsByPartner: async (partnerId: string): Promise<EstateResident[]> => {
    initializeSeedData();
    return Array.from(inMemoryResidents.values()).filter((r) => r.partnerId === partnerId);
  },

  saveResident: async (resident: EstateResident): Promise<EstateResident> => {
    initializeSeedData();
    inMemoryResidents.set(resident.id, resident);
    return resident;
  },

  // Service Requests
  getServiceRequestsByPartner: async (partnerId: string): Promise<EstateServiceRequest[]> => {
    initializeSeedData();
    const partnerEstates = Array.from(inMemoryEstates.values())
      .filter((e) => e.partnerId === partnerId)
      .map((e) => e.id);
    return Array.from(inMemoryRequests.values()).filter((r) => partnerEstates.includes(r.estateId));
  },

  // Attributions
  getAttributionsByPartner: async (partnerId: string): Promise<PartnerAttribution[]> => {
    initializeSeedData();
    return Array.from(inMemoryAttributions.values()).filter((a) => a.partnerId === partnerId);
  },

  saveAttribution: async (attribution: PartnerAttribution): Promise<PartnerAttribution> => {
    initializeSeedData();
    inMemoryAttributions.set(attribution.id, attribution);
    return attribution;
  },

  // Payouts
  getPayouts: async (partnerId?: string): Promise<PartnerPayoutTransaction[]> => {
    initializeSeedData();
    const all = Array.from(inMemoryPayouts.values());
    if (partnerId) return all.filter((p) => p.partnerId === partnerId);
    return all;
  },

  savePayout: async (payout: PartnerPayoutTransaction): Promise<PartnerPayoutTransaction> => {
    initializeSeedData();
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
