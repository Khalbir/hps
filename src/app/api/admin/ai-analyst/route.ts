import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      pendingBookings,
      unassignedCount,
      openDisputes,
      pendingParts,
      merchants,
      pendingPros,
      recentCompletedBookings,
    ] = await Promise.all([
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "PENDING", professionalId: null } }),
      prisma.dispute.findMany({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      prisma.replacementPart.findMany({ where: { status: "REQUESTED" } }),
      prisma.merchant.findMany({ select: { id: true, businessName: true, verificationStatus: true } }),
      prisma.professional.count({ where: { verificationStatus: { in: ["PENDING", "PENDING_REVIEW"] } } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
    ]);

    // 1. Calculate Comprehensive Platform Operational Health Score (0-100)
    let healthScore = 98;
    const anomalies: any[] = [];
    const recommendations: string[] = [];

    // Bottleneck 1: Unassigned bookings backlog
    if (unassignedCount > 5) {
      healthScore -= 12;
      anomalies.push({
        id: "ANOMALY_UNASSIGNED_JOBS",
        severity: "HIGH",
        category: "FIELD_OPERATIONS",
        title: "Artisan Assignment Bottleneck Detected",
        detail: `${unassignedCount} customer bookings are currently pending without an assigned verified technician.`,
        actionLabel: "Rebalance Radius in Dispatch Map",
        actionUrl: "/admin/dashboard/map",
      });
      recommendations.push(`Expand artisan dispatch radius in Abuja/Lagos or trigger broadcast dispatch notifications.`);
    } else if (unassignedCount > 0) {
      healthScore -= 4;
      anomalies.push({
        id: "ANOMALY_UNASSIGNED_MINOR",
        severity: "MEDIUM",
        category: "FIELD_OPERATIONS",
        title: `${unassignedCount} Booking(s) Awaiting Artisan Assignment`,
        detail: "Pro dispatch engine is currently searching for the closest verified technician.",
        actionLabel: "View Bookings Workflow",
        actionUrl: "/admin/dashboard/bookings",
      });
    }

    // Bottleneck 2: Open dispute backlog
    if (openDisputes.length > 3) {
      healthScore -= 15;
      anomalies.push({
        id: "ANOMALY_DISPUTE_SURGE",
        severity: "HIGH",
        category: "CUSTOMER_SUPPORT",
        title: "Dispute Escalation Surge",
        detail: `${openDisputes.length} open customer dispute tickets require immediate mediation to prevent escrow freezes.`,
        actionLabel: "Open Dispute Resolution Suite",
        actionUrl: "/admin/dashboard/disputes",
      });
      recommendations.push("Assign support agents to mediate customer complaints and review evidence photos.");
    } else if (openDisputes.length > 0) {
      healthScore -= 5;
    }

    // Bottleneck 3: High-value part quote anomaly
    const highCostParts = pendingParts.filter((p) => p.estimatedCost > 75000);
    if (highCostParts.length > 0) {
      healthScore -= 6;
      anomalies.push({
        id: "ANOMALY_PART_PRICE_SPIKE",
        severity: "MEDIUM",
        category: "PROCUREMENT",
        title: `${highCostParts.length} High-Value Part Quote(s) Flagged`,
        detail: `Quotes exceeding ₦75,000 benchmark require technical audit to prevent price-gouging.`,
        actionLabel: "Audit Replacement Parts",
        actionUrl: "/admin/dashboard/parts",
      });
      recommendations.push("Verify part quotes against registered partner hardware merchant price lists.");
    }

    // Bottleneck 4: Merchant verification pipeline
    const unverifiedMerchants = merchants.filter((m) => m.verificationStatus !== "VERIFIED");
    if (unverifiedMerchants.length > 0) {
      anomalies.push({
        id: "ANOMALY_UNVERIFIED_MERCHANTS",
        severity: "LOW",
        category: "MARKETPLACE",
        title: `${unverifiedMerchants.length} Partner Merchant(s) Pending Storefront Check`,
        detail: "Physical storefront GPS coordinates and CAC registrations require compliance signoff.",
        actionLabel: "Review Merchants",
        actionUrl: "/admin/dashboard/marketplace",
      });
    }

    // Ensure health score stays within bounds
    healthScore = Math.max(45, Math.min(100, healthScore));

    const statusBadge =
      healthScore >= 90 ? "OPTIMAL_VELOCITY" : healthScore >= 75 ? "MODERATE_FRICTION" : "REQUIRES_EXECUTIVE_INTERVENTION";

    return NextResponse.json({
      success: true,
      healthScore,
      statusBadge,
      lastAnalyzed: new Date().toISOString(),
      metrics: {
        unassignedCount,
        openDisputeCount: openDisputes.length,
        pendingPartsCount: pendingParts.length,
        pendingProsCount: pendingPros,
        completedJobsCount: recentCompletedBookings,
      },
      anomalies,
      recommendations: recommendations.length > 0 ? recommendations : ["All systems operating at peak efficiency. No immediate escalations."],
      executiveBriefing:
        healthScore >= 90
          ? "Platform dispatch, marketplace fulfillment, and escrow pipelines are operating within healthy operational SLAs."
          : `Operational friction detected across ${anomalies.length} workflow areas. CAO operational coordination recommended.`,
    });
  } catch (error: any) {
    console.error("[AI Analyst Error]:", error);
    return NextResponse.json({ error: "Failed to generate AI analytics" }, { status: 500 });
  }
}
