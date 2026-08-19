import { prisma } from "@/lib/db";
import { evaluateApprovalRequirement, ExecutiveApprovalThresholds } from "@/lib/rbac";
import { logExecutiveAuditEvent } from "@/lib/audit";

export interface CreateApprovalParams {
  actionType:
    | "ESCROW_RELEASE"
    | "DISPUTE_REFUND"
    | "PART_QUOTE_APPROVAL"
    | "SUPPLIER_DISBURSEMENT"
    | "STAFF_PROMOTION"
    | "POLICY_CHANGE"
    | "DATABASE_OPERATION"
    | "MERCHANT_SUSPENSION";
  title: string;
  description: string;
  amountNgn?: number;
  targetEntity: "BOOKING" | "PAYMENT" | "ESCROW" | "DISPUTE" | "MERCHANT" | "USER" | "STAFF" | "SETTING" | "PART" | "SYSTEM";
  targetEntityId?: string;
  requestedByRole: string;
  requestedById?: string;
  requestedByName?: string;
  metaData?: Record<string, any>;
}

export interface ApprovalDecisionParams {
  approvalId: string;
  decision: "APPROVED" | "REJECTED";
  decidedByRole: string;
  decidedById?: string;
  decidedByName?: string;
  notes?: string;
}

/**
 * Creates an approval request or executes it immediately if actor has sovereign/autonomous authority
 */
export async function submitForApproval(params: CreateApprovalParams) {
  const reqCheck = evaluateApprovalRequirement({
    actionType: params.actionType,
    amountNgn: params.amountNgn,
    actorRole: params.requestedByRole,
  });

  const isAutoApproved = !reqCheck.requiresSuperAdmin && (params.requestedByRole === "SUPER_ADMIN" || reqCheck.canCaoApprove);

  const approvalPayload = {
    id: `APPR-${Date.now().toString(36).toUpperCase()}`,
    actionType: params.actionType,
    title: params.title,
    description: params.description,
    amountNgn: params.amountNgn || 0,
    targetEntity: params.targetEntity,
    targetEntityId: params.targetEntityId || null,
    requestedByRole: params.requestedByRole,
    requestedById: params.requestedById || null,
    requestedByName: params.requestedByName || "Staff Member",
    status: isAutoApproved ? "AUTO_APPROVED" : "PENDING_SUPER_ADMIN",
    reason: reqCheck.reason,
    metaData: params.metaData || {},
    createdAt: new Date().toISOString(),
  };

  // Log in PostgreSQL audit ledger
  await logExecutiveAuditEvent({
    actorId: params.requestedById,
    actorRole: params.requestedByRole,
    action: isAutoApproved ? `AUTONOMOUS_APPROVAL: ${params.title}` : `ESCALATED_APPROVAL_REQUEST: ${params.title}`,
    entity: params.targetEntity,
    entityId: params.targetEntityId,
    amountNgn: params.amountNgn,
    newState: approvalPayload,
    notes: reqCheck.reason,
    status: isAutoApproved ? "SUCCESS" : "ESCALATED_TO_SUPER_ADMIN",
  });

  return {
    isAutoApproved,
    approval: approvalPayload,
    message: isAutoApproved
      ? "Action authorized autonomously."
      : "High-risk action escalated to Super Admin (Chief Commander) Approval Queue.",
  };
}
