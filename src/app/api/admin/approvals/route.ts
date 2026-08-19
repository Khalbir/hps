import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logExecutiveAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Fetch high-risk pending actions from AuditLog and active systems
    const [disputes, pendingParts, pendingPros, recentAudits] = await Promise.all([
      prisma.dispute.findMany({
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        include: {
          booking: {
            select: { reference: true, finalPrice: true, estimatedPrice: true },
          },
          customer: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }).catch(() => []),
      prisma.replacementPart.findMany({
        where: { status: "REQUESTED", estimatedCost: { gt: 75000 } },
        include: {
          booking: { select: { reference: true } },
          professional: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }).catch(() => []),
      prisma.professional.findMany({
        where: { verificationStatus: { in: ["PENDING", "PENDING_REVIEW"] } },
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
        orderBy: { totalJobs: "desc" },
        take: 10,
      }).catch(() => []),
      prisma.auditLog.findMany({
        where: { action: { contains: "ESCALATED" } },
        orderBy: { createdAt: "desc" },
        take: 15,
      }).catch(() => []),
    ]);

    // Build synthesized Approval Queue Items
    const approvalQueue: any[] = [];

    // 1. High-value dispute refunds requiring Super Admin signoff
    disputes.forEach((d) => {
      const amount = d.booking?.finalPrice || d.booking?.estimatedPrice || 0;
      approvalQueue.push({
        id: `APPR-DISP-${d.id}`,
        sourceId: d.id,
        type: "DISPUTE_REFUND",
        title: `Customer Dispute Refund Claim • Booking #${d.booking?.reference || "N/A"}`,
        description: `Customer ${d.customer?.firstName} ${d.customer?.lastName} opened dispute: "${d.reason}". Total claim amount: ₦${amount.toLocaleString()}.`,
        amountNgn: amount,
        urgency: amount > 50000 ? "HIGH_RISK_SUPER_ADMIN" : "STANDARD_CAO",
        requiresSuperAdmin: amount > 50000,
        status: "PENDING_SUPER_ADMIN",
        requestedByRole: "CUSTOMER_SUPPORT",
        createdAt: d.createdAt,
      });
    });

    // 2. High-value spare part quotes requiring signoff
    pendingParts.forEach((p) => {
      approvalQueue.push({
        id: `APPR-PART-${p.id}`,
        sourceId: p.id,
        type: "PART_QUOTE_APPROVAL",
        title: `High-Value Spare Part Quote: ${p.partName}`,
        description: `Artisan ${p.professional?.user?.firstName || "Pro"} requested ₦${p.estimatedCost.toLocaleString()} for ${p.partName} on Booking #${p.booking?.reference || "N/A"}.`,
        amountNgn: p.estimatedCost,
        urgency: "HIGH_RISK_SUPER_ADMIN",
        requiresSuperAdmin: true,
        status: "PENDING_SUPER_ADMIN",
        requestedByRole: "OPERATIONS_MANAGER",
        createdAt: p.createdAt,
      });
    });

    // 3. Verified Pro Compliance Gate
    if (pendingPros.length > 0) {
      approvalQueue.push({
        id: `APPR-PROS-BATCH`,
        sourceId: "PROS-BATCH",
        type: "ARTISAN_VERIFICATION_BATCH",
        title: `Batch Compliance Audit (${pendingPros.length} Pending Pros)`,
        description: `${pendingPros.length} artisans have completed the 5-pillar verification dossier and are awaiting formal badge issuance.`,
        amountNgn: 0,
        urgency: "STANDARD_CAO",
        requiresSuperAdmin: false,
        status: "PENDING_CAO",
        requestedByRole: "VERIFICATION_OFFICER",
        createdAt: pendingPros[0]?.createdAt || new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      approvalQueue,
      metrics: {
        totalPending: approvalQueue.length,
        highRiskCount: approvalQueue.filter((a) => a.requiresSuperAdmin).length,
        caoManageableCount: approvalQueue.filter((a) => !a.requiresSuperAdmin).length,
      },
    });
  } catch (error: any) {
    console.error("[Approvals GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { approvalId, decision, actorRole, actorId, notes, sourceId, type } = body;

    if (!approvalId || !decision) {
      return NextResponse.json({ error: "Approval ID and decision are required" }, { status: 400 });
    }

    // Execute the underlying operational decision
    if (type === "DISPUTE_REFUND" && sourceId) {
      await prisma.dispute.update({
        where: { id: sourceId },
        data: {
          status: decision === "APPROVED" ? "RESOLVED" : "REJECTED",
          resolutionNotes: notes || `Decision ${decision} by ${actorRole || "Executive Admin"}`,
        },
      }).catch(() => {});
    } else if (type === "PART_QUOTE_APPROVAL" && sourceId) {
      await prisma.replacementPart.update({
        where: { id: sourceId },
        data: {
          status: decision === "APPROVED" ? "APPROVED" : "REJECTED",
          adminNotes: notes || `Decision ${decision} by ${actorRole || "Executive Admin"}`,
        },
      }).catch(() => {});
    }

    // Log in Immutable Audit Log
    await logExecutiveAuditEvent({
      actorId: actorId || null,
      actorRole: actorRole || "SUPER_ADMIN",
      action: `EXECUTIVE_DECISION: ${decision} (${approvalId})`,
      entity: "SYSTEM",
      entityId: sourceId || approvalId,
      notes: notes || `Executive decision executed by ${actorRole}.`,
      status: decision === "APPROVED" ? "SUCCESS" : "REJECTED",
    });

    return NextResponse.json({
      success: true,
      message: `Approval request ${approvalId} has been marked as ${decision}.`,
      decision,
    });
  } catch (error: any) {
    console.error("[Approvals POST Error]:", error);
    return NextResponse.json({ error: "Failed to process approval decision" }, { status: 500 });
  }
}
