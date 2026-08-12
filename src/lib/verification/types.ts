export type PermanentAddressStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export type ServiceRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ExtensibleVerificationType =
  | "PERMANENT_ADDRESS"
  | "NIN_IDENTITY"
  | "CAC_BUSINESS"
  | "ARTISAN_CREDENTIALS";

export interface BookingAddressItem {
  id: string;
  label: string; // e.g., "Home", "Office", "Construction Site", "Rental Property"
  address: string;
  city: string;
  state: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface PermanentAddressState {
  address: string | null;
  proofUrl: string | null;
  status: PermanentAddressStatus;
  notes: string | null;
  pendingAddress: string | null;
  pendingProofUrl: string | null;
  submittedAt?: string;
  verifiedAt?: string;
}

export interface VerificationAuditLog {
  id: string;
  userId?: string;
  adminId?: string;
  action:
    | "SUBMIT_ADDRESS"
    | "REQUEST_ADDRESS_CHANGE"
    | "APPROVE_ADDRESS"
    | "REJECT_ADDRESS"
    | "SUSPEND_ADDRESS"
    | "APPROVE_ADDRESS_CHANGE"
    | "REJECT_ADDRESS_CHANGE"
    | "VERIFY_NIN"
    | "VERIFY_ARTISAN";
  entity: "USER" | "ADDRESS" | "PROFESSIONAL";
  entityId?: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface ServiceRiskConfig {
  serviceId: string;
  serviceName: string;
  categorySlug: string;
  isHighRisk: boolean;
  riskLevel: ServiceRiskLevel;
  requiresAddressVerification: boolean;
}

export interface TrustBadgeConfig {
  type: "ADDRESS_VERIFIED" | "IDENTITY_VERIFIED" | "ARTISAN_VERIFIED" | "HIGH_RISK_GATED";
  label: string;
  description: string;
  badgeStyle: "success" | "warning" | "danger" | "info";
}

/**
 * Extensible Verification Provider Interface
 * Standard contract allowing future verification modules (NIN, CAC, Address, etc.) to plug in seamlessly.
 */
export interface VerificationProvider<TSubmitInput, TVerifyResult> {
  providerId: ExtensibleVerificationType;
  providerName: string;
  submitForVerification(userId: string, input: TSubmitInput): Promise<{ success: boolean; message: string; status: PermanentAddressStatus }>;
  evaluateVerification(userId: string): Promise<TVerifyResult>;
  adminAuditAction(adminId: string, targetUserId: string, decision: "APPROVE" | "REJECT" | "SUSPEND", notes?: string): Promise<{ success: boolean; message: string }>;
}
