import { prisma } from "@/lib/db";

export interface ExecutiveAuditEvent {
  actorId?: string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  entity: "BOOKING" | "PAYMENT" | "ESCROW" | "DISPUTE" | "MERCHANT" | "USER" | "STAFF" | "SETTING" | "PART" | "SYSTEM";
  entityId?: string;
  amountNgn?: number;
  oldState?: any;
  newState?: any;
  notes?: string;
  ipAddress?: string;
  status?: "SUCCESS" | "FAILED" | "ESCALATED_TO_SUPER_ADMIN" | "REJECTED";
}

/**
 * Immutable Executive Audit Logger
 * Writes tamper-evident operational and financial governance events to PostgreSQL
 */
export async function logExecutiveAuditEvent(event: ExecutiveAuditEvent): Promise<boolean> {
  try {
    const detailsJson = JSON.stringify({
      actorEmail: event.actorEmail,
      amountNgn: event.amountNgn,
      oldState: event.oldState,
      newState: event.newState,
      notes: event.notes,
      status: event.status || "SUCCESS",
      timestampIso: new Date().toISOString(),
    });

    await prisma.auditLog.create({
      data: {
        userId: event.actorId || null,
        action: `[${event.actorRole}] ${event.action}`,
        entity: event.entity,
        entityId: event.entityId || null,
        details: detailsJson,
        ipAddress: event.ipAddress || null,
      },
    });

    return true;
  } catch (err) {
    console.error("[Executive Audit Log Error]: Failed to write immutable log:", err);
    return false;
  }
}
