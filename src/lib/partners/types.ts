/**
 * HandyHub Partner Network — Type Definitions & Interfaces
 */

export type PartnerCategory =
  | "ESTATE_MANAGER"
  | "REALTOR"
  | "INFLUENCER"
  | "COMMUNITY_LEADER"
  | "CORPORATE_PARTNER"
  | "CONTENT_CREATOR";

export type PartnerTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type PartnerStatus = "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";

export interface PartnerProfile {
  id: string;
  partnerId: string; // e.g. "HHP-PTR-72819"
  userId?: string | null;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  category: PartnerCategory;
  operatingState: string;
  city?: string;
  address?: string;
  referralCode: string; // e.g. "PTR-SUNNYVALE-82"
  qrCodeUrl: string; // SVG Data URI
  status: PartnerStatus;
  tierLevel: PartnerTier;
  walletBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  bankName?: string;
  bankAccount?: string;
  accountName?: string;
  bankCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerEstate {
  id: string;
  partnerId: string;
  name: string; // e.g. "Sunnyvale Estate"
  city: string; // e.g. "Abuja"
  state: string; // e.g. "FCT"
  address: string;
  totalUnits: number; // e.g. 350
  occupiedUnits?: number;
  gateSecurityPhone?: string;
  gatePassRequired: boolean;
  preferredCategories: string[]; // ["plumbing", "electrical", "cleaning", "fumigation"]
  monthlyServiceVolume?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EstateResident {
  id: string;
  estateId: string;
  partnerId: string;
  userId?: string | null;
  residentName: string;
  unitNumber: string; // e.g. "House 14B, Palm Close"
  phone: string;
  email?: string;
  status: "ACTIVE" | "INVITED" | "INACTIVE";
  totalBookings: number;
  totalSpendNgn: number;
  lastBookingDate?: string | null;
  joinedAt: string;
}

export interface EstateServiceRequest {
  id: string;
  estateId: string;
  estateName: string;
  unitNumber: string;
  residentName: string;
  residentPhone: string;
  serviceCategory: string;
  serviceName: string;
  status: "PENDING" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  amount: number;
  commissionEarned: number;
  assignedArtisan?: {
    name: string;
    phone: string;
    rating: number;
    avatar?: string;
    trade: string;
  };
  scheduledDate: string;
  createdAt: string;
}

export interface PartnerAttribution {
  id: string;
  partnerId: string;
  referralCode: string;
  referredUserId?: string;
  referredUserRole: "CUSTOMER" | "PROFESSIONAL";
  referredName: string;
  referredEmail: string;
  referredPhone?: string;
  attributionType:
    | "ESTATE_RESIDENT"
    | "ORGANIC_REFERRAL"
    | "REALTOR_CLIENT"
    | "INFLUENCER_AUDIENCE"
    | "ARTISAN_RECRUIT";
  totalJobs: number;
  totalRevenueNgn: number;
  totalCommissionEarnedNgn: number;
  isPermanent: boolean;
  fraudScore: number;
  createdAt: string;
}

export interface PartnerCommissionConfig {
  id: string;
  rates: {
    estateManagerBookingPercent: number; // e.g. 5.0%
    estateManagerResidentBonusNgn: number; // e.g. 1000
    realtorBookingPercent: number; // e.g. 6.0%
    realtorMoveInBonusNgn: number; // e.g. 2000
    influencerBookingPercent: number; // e.g. 4.0%
    influencerFirstBookingBonusNgn: number; // e.g. 500
    communityLeaderBookingPercent: number; // e.g. 5.0%
    corporatePartnerBookingPercent: number; // e.g. 7.5%
    artisanRecruitmentBonusNgn: number; // e.g. 2500 (after 3 completed jobs)
  };
  tierMultipliers: {
    bronze: number; // 1.0x
    silver: number; // 1.15x (25+ monthly bookings)
    gold: number; // 1.30x (75+ monthly bookings)
    platinum: number; // 1.50x (150+ monthly bookings)
  };
  payoutRules: {
    minimumPayoutNgn: number; // e.g. 10,000
    monthlyPayoutDay: number; // e.g. 1 (1st of month)
    autoPayoutEnabled: boolean;
    requireBankVerification: boolean;
    maxFraudRiskScore: number; // 25
  };
  updatedAt: string;
  updatedBy?: string;
}

export interface PartnerPayoutTransaction {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "REJECTED";
  reference: string;
  notes?: string;
  requestedAt: string;
  processedAt?: string;
}
