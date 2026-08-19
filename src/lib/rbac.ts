/**
 * HandyHub Pro Solutions - Enterprise Role-Based Access Control (RBAC) & Governance Engine
 * Features Dual Executive Governance:
 * 1. Super Admin (Chief Commander) - Platform Policy, High-Risk Approvals, Staff Promotions, System Integrity
 * 2. Executive Operations Manager / CAO (Second-in-Command) - Cross-Departmental Command, Operations, Logistics & Escalations
 * Plus specialized departmental managers (Operations, Marketplace, Verification, Support, Finance)
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "EXECUTIVE_OPERATIONS_MANAGER" // CAO / Second-in-Command
  | "OPERATIONS_MANAGER"
  | "MARKETPLACE_MANAGER"
  | "VERIFICATION_OFFICER"
  | "CUSTOMER_SUPPORT"
  | "FINANCE"
  | "ADMIN" // Legacy fallback mapped to SUPER_ADMIN
  | "PROFESSIONAL"
  | "CUSTOMER";

export interface RolePermissions {
  dashboard: boolean;
  executiveApprovals: boolean;
  aiAnalyst: boolean;
  marketplace: boolean;
  map: boolean;
  bookings: boolean;
  parts: boolean;
  users: boolean;
  professionals: boolean;
  verification: boolean;
  payments: boolean;
  disputes: boolean;
  reviews: boolean;
  promoCodes: boolean;
  analytics: boolean;
  notifications: boolean;
  settings: boolean;
  backup: boolean;
  manageRoles: boolean;
}

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  // 1. CHIEF COMMANDER: Supreme platform sovereignty
  SUPER_ADMIN: {
    dashboard: true,
    executiveApprovals: true,
    aiAnalyst: true,
    marketplace: true,
    map: true,
    bookings: true,
    parts: true,
    users: true,
    professionals: true,
    verification: true,
    payments: true,
    disputes: true,
    reviews: true,
    promoCodes: true,
    analytics: true,
    notifications: true,
    settings: true,
    backup: true,
    manageRoles: true,
  },

  // 2. CHIEF ADMINISTRATIVE OFFICER (CAO) / EXECUTIVE OPS MANAGER: Second in command
  EXECUTIVE_OPERATIONS_MANAGER: {
    dashboard: true,
    executiveApprovals: true, // Can approve operational items <= threshold & escalate high-risk to Super Admin
    aiAnalyst: true,
    marketplace: true,
    map: true,
    bookings: true,
    parts: true,
    users: true, // View staff & user directory
    professionals: true,
    verification: true,
    payments: true, // Audit escrow & transactions
    disputes: true,
    reviews: true,
    promoCodes: true,
    analytics: true,
    notifications: true,
    settings: false, // Core system settings restricted to Super Admin
    backup: false, // Database backup & purge restricted to Super Admin
    manageRoles: false, // Staff hiring/promotion restricted to Super Admin
  },

  // Legacy fallback mapped to Super Admin level operations
  ADMIN: {
    dashboard: true,
    executiveApprovals: true,
    aiAnalyst: true,
    marketplace: true,
    map: true,
    bookings: true,
    parts: true,
    users: true,
    professionals: true,
    verification: true,
    payments: true,
    disputes: true,
    reviews: true,
    promoCodes: true,
    analytics: true,
    notifications: true,
    settings: true,
    backup: true,
    manageRoles: false,
  },

  // 3. OPERATIONS MANAGER: Field booking dispatch & technician coordination
  OPERATIONS_MANAGER: {
    dashboard: true,
    executiveApprovals: false,
    aiAnalyst: true,
    marketplace: true,
    map: true,
    bookings: true,
    parts: true,
    users: true,
    professionals: true,
    verification: false,
    payments: false,
    disputes: true,
    reviews: true,
    promoCodes: false,
    analytics: true,
    notifications: true,
    settings: false,
    backup: false,
    manageRoles: false,
  },

  // 4. MARKETPLACE MANAGER: Commercial vendor onboarding, catalog moderation & logistics
  MARKETPLACE_MANAGER: {
    dashboard: true,
    executiveApprovals: false,
    aiAnalyst: true,
    marketplace: true,
    map: true,
    bookings: false,
    parts: true,
    users: false,
    professionals: false,
    verification: false,
    payments: false,
    disputes: true, // Marketplace disputes
    reviews: true,
    promoCodes: true,
    analytics: true,
    notifications: true,
    settings: false,
    backup: false,
    manageRoles: false,
  },

  // 5. VERIFICATION OFFICER: 5-pillar artisan dossiers & customer address proof audits
  VERIFICATION_OFFICER: {
    dashboard: true,
    executiveApprovals: false,
    aiAnalyst: false,
    marketplace: false,
    map: false,
    bookings: false,
    parts: false,
    users: false,
    professionals: true,
    verification: true,
    payments: false,
    disputes: false,
    reviews: false,
    promoCodes: false,
    analytics: false,
    notifications: true,
    settings: false,
    backup: false,
    manageRoles: false,
  },

  // 6. CUSTOMER SUPPORT: Inquiries, booking tracking & dispute mediation
  CUSTOMER_SUPPORT: {
    dashboard: true,
    executiveApprovals: false,
    aiAnalyst: false,
    marketplace: true,
    map: false,
    bookings: true,
    parts: true,
    users: true,
    professionals: true,
    verification: false,
    payments: false,
    disputes: true,
    reviews: true,
    promoCodes: false,
    analytics: false,
    notifications: true,
    settings: false,
    backup: false,
    manageRoles: false,
  },

  // 7. FINANCE ADMIN: Escrow vault, payment gateway audits & payout transfers
  FINANCE: {
    dashboard: true,
    executiveApprovals: false,
    aiAnalyst: true,
    marketplace: true,
    map: false,
    bookings: true,
    parts: true,
    users: false,
    professionals: false,
    verification: false,
    payments: true,
    disputes: true,
    reviews: false,
    promoCodes: true,
    analytics: true,
    notifications: true,
    settings: false,
    backup: false,
    manageRoles: false,
  },
};

export const ROLE_LABELS: Record<string, { label: string; title: string; description: string; badgeColor: string; tier: number }> = {
  SUPER_ADMIN: {
    label: "Chief Commander",
    title: "Super Admin",
    description: "Supreme platform sovereignty. Complete authority over system policy, staff promotions, API credentials, and high-risk financial approvals.",
    badgeColor: "#EF4444",
    tier: 1,
  },
  EXECUTIVE_OPERATIONS_MANAGER: {
    label: "Executive Operations (CAO)",
    title: "Chief Administrative Officer",
    description: "Second in Command. Cross-departmental operational command coordinating field dispatch, marketplace merchants, parts procurement, and daily escalations.",
    badgeColor: "#06B6D4",
    tier: 2,
  },
  AI_EXECUTIVE_ANALYST: {
    label: "AI Executive Analyst",
    title: "Chief Commander AI Assistant",
    description: "Autonomous AI Intelligence Suite & Operational Assistant to the Chief Commander. Real-time platform diagnostics, dispatch bottleneck detection, price anomaly alerts, and automated oversight.",
    badgeColor: "#6366F1",
    tier: 2,
  },
  OPERATIONS_MANAGER: {
    label: "Operations Manager",
    title: "Head of Field Operations",
    description: "Manages live bookings, technician dispatch radius, emergency artisan matching, and operational dispute triage.",
    badgeColor: "#3B82F6",
    tier: 3,
  },
  MARKETPLACE_MANAGER: {
    label: "Marketplace Manager",
    title: "Head of Merchant & Logistics",
    description: "Governs partner merchant store onboarding, product catalog moderation, district delivery zones, and merchant dispute resolution.",
    badgeColor: "#10B981",
    tier: 3,
  },
  VERIFICATION_OFFICER: {
    label: "Verification Officer",
    title: "Compliance & Safety Officer",
    description: "Audits 5-pillar artisan dossiers (NIN, live biometrics, trade cert, address proof, guarantors) and customer proof of address.",
    badgeColor: "#F59E0B",
    tier: 4,
  },
  CUSTOMER_SUPPORT: {
    label: "Customer Support",
    title: "Customer Support Specialist",
    description: "Handles customer inquiries, booking progress tracking, review moderation, and dispute mediation.",
    badgeColor: "#8B5CF6",
    tier: 4,
  },
  FINANCE: {
    label: "Finance Admin",
    title: "Finance & Escrow Controller",
    description: "Oversees Paystack transaction logs, escrow releases, artisan bank withdrawals, and financial audits.",
    badgeColor: "#EC4899",
    tier: 3,
  },
};

/**
 * Enterprise Configurable Executive Approval Thresholds
 */
export interface ExecutiveApprovalThresholds {
  maxEscrowReleaseAutoApproveNgn: number;
  maxDisputeRefundAutoApproveNgn: number;
  maxPartQuoteAutoApproveNgn: number;
  maxSupplierDisbursementAutoApproveNgn: number;
  requireSuperAdminForStaffPromotion: boolean;
  requireSuperAdminForCommissionPolicy: boolean;
  requireSuperAdminForDbBackup: boolean;
  requireSuperAdminForMerchantDeactivation: boolean;
}

export const DEFAULT_APPROVAL_THRESHOLDS: ExecutiveApprovalThresholds = {
  maxEscrowReleaseAutoApproveNgn: 100000,      // Releases > ₦100k require Super Admin approval
  maxDisputeRefundAutoApproveNgn: 50000,        // Refunds > ₦50k require Super Admin approval
  maxPartQuoteAutoApproveNgn: 75000,            // Part quotes > ₦75k require Super Admin approval
  maxSupplierDisbursementAutoApproveNgn: 150000,// Disbursements > ₦150k require Super Admin approval
  requireSuperAdminForStaffPromotion: true,
  requireSuperAdminForCommissionPolicy: true,
  requireSuperAdminForDbBackup: true,
  requireSuperAdminForMerchantDeactivation: true,
};

/**
 * Evaluates whether an administrative action requires Super Admin escalation
 */
export function evaluateApprovalRequirement(params: {
  actionType:
    | "ESCROW_RELEASE"
    | "DISPUTE_REFUND"
    | "PART_QUOTE_APPROVAL"
    | "SUPPLIER_DISBURSEMENT"
    | "STAFF_PROMOTION"
    | "POLICY_CHANGE"
    | "DATABASE_OPERATION"
    | "MERCHANT_SUSPENSION";
  amountNgn?: number;
  actorRole: string;
  thresholds?: Partial<ExecutiveApprovalThresholds>;
}): { requiresSuperAdmin: boolean; reason: string; canCaoApprove: boolean } {
  const t = { ...DEFAULT_APPROVAL_THRESHOLDS, ...params.thresholds };
  const role = (params.actorRole || "").toUpperCase();

  // Super Admin can approve everything directly
  if (role === "SUPER_ADMIN") {
    return { requiresSuperAdmin: false, reason: "Actor is Super Admin (Chief Commander).", canCaoApprove: true };
  }

  // Staff promotion / Demotion
  if (params.actionType === "STAFF_PROMOTION") {
    return {
      requiresSuperAdmin: true,
      reason: "Staff hiring, promotion, and role reassignment strictly require Chief Commander authorization.",
      canCaoApprove: false,
    };
  }

  // System Policy / Commission Policy
  if (params.actionType === "POLICY_CHANGE") {
    return {
      requiresSuperAdmin: true,
      reason: "Platform commission rules, pricing policies, and city toggles require Super Admin approval.",
      canCaoApprove: false,
    };
  }

  // Database Backup / Purge
  if (params.actionType === "DATABASE_OPERATION") {
    return {
      requiresSuperAdmin: true,
      reason: "Database backup export and system purge operations require Super Admin credentials.",
      canCaoApprove: false,
    };
  }

  const amount = Number(params.amountNgn || 0);

  // Escrow Release Check
  if (params.actionType === "ESCROW_RELEASE") {
    if (amount > t.maxEscrowReleaseAutoApproveNgn) {
      return {
        requiresSuperAdmin: true,
        reason: `Escrow release of ₦${amount.toLocaleString()} exceeds the CAO autonomous limit of ₦${t.maxEscrowReleaseAutoApproveNgn.toLocaleString()}.`,
        canCaoApprove: false,
      };
    }
    return {
      requiresSuperAdmin: false,
      reason: `Escrow release is within CAO autonomous limit (≤ ₦${t.maxEscrowReleaseAutoApproveNgn.toLocaleString()}).`,
      canCaoApprove: true,
    };
  }

  // Dispute Refund Check
  if (params.actionType === "DISPUTE_REFUND") {
    if (amount > t.maxDisputeRefundAutoApproveNgn) {
      return {
        requiresSuperAdmin: true,
        reason: `Dispute refund of ₦${amount.toLocaleString()} exceeds the CAO autonomous limit of ₦${t.maxDisputeRefundAutoApproveNgn.toLocaleString()}.`,
        canCaoApprove: false,
      };
    }
    return {
      requiresSuperAdmin: false,
      reason: `Dispute refund is within CAO autonomous limit (≤ ₦${t.maxDisputeRefundAutoApproveNgn.toLocaleString()}).`,
      canCaoApprove: true,
    };
  }

  // Part Quote Check
  if (params.actionType === "PART_QUOTE_APPROVAL") {
    if (amount > t.maxPartQuoteAutoApproveNgn) {
      return {
        requiresSuperAdmin: true,
        reason: `Procurement part quote of ₦${amount.toLocaleString()} exceeds the standard limit of ₦${t.maxPartQuoteAutoApproveNgn.toLocaleString()}.`,
        canCaoApprove: false,
      };
    }
    return {
      requiresSuperAdmin: false,
      reason: `Part quote is within standard approval threshold.`,
      canCaoApprove: true,
    };
  }

  // Supplier Disbursement Check
  if (params.actionType === "SUPPLIER_DISBURSEMENT") {
    if (amount > t.maxSupplierDisbursementAutoApproveNgn) {
      return {
        requiresSuperAdmin: true,
        reason: `Supplier direct bank transfer of ₦${amount.toLocaleString()} requires Super Admin authorization.`,
        canCaoApprove: false,
      };
    }
    return {
      requiresSuperAdmin: false,
      reason: `Supplier transfer is within CAO threshold.`,
      canCaoApprove: true,
    };
  }

  return { requiresSuperAdmin: false, reason: "Standard operational action.", canCaoApprove: true };
}

export function hasPermission(role: string | undefined | null, permission: keyof RolePermissions): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role.toUpperCase()];
  if (!perms) return false;
  return !!perms[permission];
}

export function getRoleBadgeInfo(role: string | undefined | null) {
  const normalized = (role || "CUSTOMER").toUpperCase();
  if (ROLE_LABELS[normalized]) {
    return ROLE_LABELS[normalized];
  }
  if (normalized === "ADMIN") {
    return {
      label: "Chief Commander",
      title: "Super Admin",
      description: "Supreme platform sovereignty.",
      badgeColor: "#EF4444",
      tier: 1,
    };
  }
  if (normalized === "PROFESSIONAL") {
    return {
      label: "Verified Artisan",
      title: "Skilled Professional Partner",
      description: "Vetted field service technician.",
      badgeColor: "#10B981",
      tier: 5,
    };
  }
  if (normalized === "CUSTOMER") {
    return {
      label: "Client / Customer",
      title: "Customer Account",
      description: "Residential & commercial service client.",
      badgeColor: "#0EA5E9",
      tier: 5,
    };
  }
  return {
    label: normalized,
    title: normalized,
    description: "Platform Account",
    badgeColor: "#64748B",
    tier: 5,
  };
}
