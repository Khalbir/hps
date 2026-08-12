import {
  PermanentAddressStatus,
  ServiceRiskLevel,
  BookingAddressItem,
  PermanentAddressState,
  TrustBadgeConfig,
} from "./types";

/**
 * Service Categories / Slugs classified as HIGH_RISK
 */
const HIGH_RISK_CATEGORIES = [
  "electrical",
  "security",
  "solar",
  "locksmith",
  "gas-piping",
  "structural-masonry",
];

const HIGH_RISK_KEYWORDS = [
  "rewiring",
  "breaker",
  "solar",
  "inverter",
  "cctv",
  "locksmith",
  "gas",
  "high voltage",
];

/**
 * Evaluates whether a service is classified as HIGH_RISK requiring verified permanent address before booking confirmation.
 */
export function isServiceHighRisk(categorySlug: string = "", serviceName: string = ""): boolean {
  const normCategory = (categorySlug || "").toLowerCase();
  const normName = (serviceName || "").toLowerCase();

  if (HIGH_RISK_CATEGORIES.some((c) => normCategory.includes(c))) {
    return true;
  }
  return HIGH_RISK_KEYWORDS.some((kw) => normName.includes(kw));
}

export function getServiceRiskLevel(categorySlug: string = "", serviceName: string = ""): ServiceRiskLevel {
  if (isServiceHighRisk(categorySlug, serviceName)) {
    return "HIGH";
  }
  if (normIncludes(categorySlug, "plumbing") || normIncludes(categorySlug, "hvac")) {
    return "MEDIUM";
  }
  return "LOW";
}

function normIncludes(source: string, match: string): boolean {
  return (source || "").toLowerCase().includes(match);
}

/**
 * Evaluates if a booking is allowed to proceed to confirmation based on service risk level and user address status.
 */
export interface RiskGateResult {
  canProceed: boolean;
  requiresVerification: boolean;
  reason: string;
  badge: TrustBadgeConfig;
  statusExplanation: {
    title: string;
    description: string;
    whatHappensNext: string;
    stepIndex: number; // 1: Not Submitted, 2: Pending Review, 3: Verified, 4: Rejected/Suspended
  };
}

export function evaluateBookingRiskGate(
  categorySlug: string,
  serviceName: string,
  addressStatus: PermanentAddressStatus = "NOT_SUBMITTED"
): RiskGateResult {
  const highRisk = isServiceHighRisk(categorySlug, serviceName);
  const isVerified = addressStatus === "VERIFIED";

  // Low & Medium Risk Services: Allow booking while verification is PENDING or even NOT_SUBMITTED
  if (!highRisk) {
    if (isVerified) {
      return {
        canProceed: true,
        requiresVerification: false,
        reason: "Your permanent address is fully verified. Standard booking approved.",
        badge: {
          type: "ADDRESS_VERIFIED",
          label: "Verified Address",
          description: "Permanent address audited & verified by HandyHub Compliance.",
          badgeStyle: "success",
        },
        statusExplanation: {
          title: "Address Verified ✅",
          description: "Your home address is fully verified. Fast-track booking enabled.",
          whatHappensNext: "Your assigned artisan will receive verified navigation directions.",
          stepIndex: 3,
        },
      };
    }

    if (addressStatus === "PENDING") {
      return {
        canProceed: true, // ALLOW LOW RISK BOOKING WHILE PENDING!
        requiresVerification: true,
        reason: "Verification is pending review, but low-risk service booking is allowed.",
        badge: {
          type: "ADDRESS_VERIFIED",
          label: "Address Verification Pending ⏳",
          description: "Document submitted & currently undergoing routine compliance audit.",
          badgeStyle: "warning",
        },
        statusExplanation: {
          title: "Verification Pending Audit ⏳",
          description: "Your proof of address is being verified by our compliance team (ETA: < 24 hrs).",
          whatHappensNext: "You can complete this booking now! Verification will finish in the background.",
          stepIndex: 2,
        },
      };
    }

    // NOT_SUBMITTED or REJECTED for low-risk
    return {
      canProceed: true,
      requiresVerification: false,
      reason: "Low-risk service allowed with unverified address. Submit proof anytime in dashboard.",
      badge: {
        type: "ADDRESS_VERIFIED",
        label: "Standard Unverified Address",
        description: "Submit address proof in profile to unlock high-risk services.",
        badgeStyle: "info",
      },
      statusExplanation: {
        title: "Unverified Booking Address",
        description: "You have not submitted address proof yet.",
        whatHappensNext: "You can proceed with basic service booking. Upgrade in profile anytime.",
        stepIndex: 1,
      },
    };
  }

  // HIGH-RISK SERVICES: Strictly require VERIFIED address before confirmation!
  if (isVerified) {
    return {
      canProceed: true,
      requiresVerification: true,
      reason: "High-risk service cleared: Verified address confirmed.",
      badge: {
        type: "ADDRESS_VERIFIED",
        label: "Verified Address • High-Risk Cleared ✅",
        description: "Security credentials verified for electrical and high-risk work.",
        badgeStyle: "success",
      },
      statusExplanation: {
        title: "High-Risk Clearance Approved ✅",
        description: "Your verified status satisfies safety and insurance requirements.",
        whatHappensNext: "Dispatching senior certified technician to your verified location.",
        stepIndex: 3,
      },
    };
  }

  // High-Risk & Address NOT Verified (PENDING, NOT_SUBMITTED, REJECTED, SUSPENDED)
  const isPending = addressStatus === "PENDING";
  return {
    canProceed: false, // GATE HIGH RISK BOOKING!
    requiresVerification: true,
    reason: isPending
      ? "High-risk services (electrical/security/solar) require verified address. Your submitted proof is currently pending admin review."
      : "High-risk services (electrical/security/solar) require address document upload and admin verification before confirmation.",
    badge: {
      type: "HIGH_RISK_GATED",
      label: isPending ? "Verification Pending Audit ⏳" : "Verification Required 🔒",
      description: "Address proof verification mandatory for high-risk installations.",
      badgeStyle: "danger",
    },
    statusExplanation: {
      title: isPending ? "Verification Pending Admin Audit ⏳" : "Permanent Address Verification Required 🔒",
      description: isPending
        ? "Your address document has been uploaded and is being reviewed by HandyHub Compliance (ETA: 24h)."
        : "For safety, insurance, and fraud prevention, high-risk technical services require proof of address document verification.",
      whatHappensNext: isPending
        ? "Our team is processing your document. Once approved, this booking will automatically confirm!"
        : "Upload a utility bill or tenancy agreement. Verification takes less than 24 hours.",
      stepIndex: isPending ? 2 : 1,
    },
  };
}

/**
 * Safely parses booking addresses from JSON string array
 */
export function parseBookingAddresses(rawJson?: string | null): BookingAddressItem[] {
  if (!rawJson) return [];
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}
