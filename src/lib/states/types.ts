/**
 * HandyHub Pro Solutions — Nigerian State Operating Control System
 * Types & Data Contracts
 */

export type GeopoliticalZone =
  | "NORTH_CENTRAL"
  | "NORTH_EAST"
  | "NORTH_WEST"
  | "SOUTH_EAST"
  | "SOUTH_SOUTH"
  | "SOUTH_WEST";

export type StateOperatingStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "COMING_SOON";

export interface NigerianState {
  code: string; // e.g. "FCT", "LAGOS", "RIVERS"
  name: string; // e.g. "FCT Abuja", "Lagos State"
  capital: string; // e.g. "Abuja", "Ikeja"
  zone: GeopoliticalZone;
  zoneLabel: string; // e.g. "North Central"
  isActive: boolean;
  status: StateOperatingStatus;
  coverageSummary: string; // e.g. "AMAC, Bwari, Gwagwalada, Kuje, Kwali, Abaji"
  lgas: string[]; // List of Local Government Areas
  coordinates: {
    lat: number;
    lng: number;
  };
  activeArtisansCount: number;
  activeEstatesCount: number;
  totalBookingsCount: number;
  waitlistCount: number;
  launchedAt?: string | null;
  deactivatedAt?: string | null;
  deactivationReason?: string | null;
  lastUpdatedBy?: string;
  updatedAt: string;
}

export interface StateAuditLog {
  id: string;
  stateCode: string;
  stateName: string;
  action: "ACTIVATED" | "DEACTIVATED" | "STATUS_CHANGED" | "COVERAGE_UPDATED";
  previousStatus: StateOperatingStatus;
  newStatus: StateOperatingStatus;
  actorId: string;
  actorEmail: string;
  actorRole: "SUPER_ADMIN";
  reason: string;
  ipAddress?: string;
  timestamp: string;
}

export interface StateWaitlistEntry {
  id: string;
  stateCode: string;
  stateName: string;
  lga?: string;
  city?: string;
  fullName: string;
  email: string;
  phone: string;
  userType: "CUSTOMER" | "ARTISAN" | "ESTATE_MANAGER" | "MERCHANT";
  notes?: string;
  createdAt: string;
}

export interface StateSystemMetrics {
  totalStates: number; // 37 (36 + FCT)
  activeStatesCount: number;
  inactiveStatesCount: number;
  totalWaitlistSubscribers: number;
  totalAuditLogsCount: number;
  lastStateModified?: {
    name: string;
    action: string;
    timestamp: string;
  } | null;
}
