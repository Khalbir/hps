import { NextResponse } from "next/server";
import { partnerStore } from "@/lib/partners/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const partners = await partnerStore.getAllPartners();
    const payouts = await partnerStore.getPayouts();
    const config = await partnerStore.getConfig();

    const totalPartners = partners.length;
    const totalEstates = partners.filter((p) => p.category === "ESTATE_MANAGER").length;
    const totalEarningsDisbursed = partners.reduce((sum, p) => sum + p.totalWithdrawn, 0);
    const totalPendingPayouts = payouts
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalPartners,
        totalEstates,
        totalEarningsDisbursed,
        totalPendingPayouts,
      },
      partners,
      payouts,
      config,
    });
  } catch (error: any) {
    console.error("[Admin Partners GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch partner data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, partnerId, payoutId, status, tierLevel, note } = body;

    // Action 1: Update Partner Status or Tier
    if (action === "UPDATE_PARTNER" && partnerId) {
      const partner = await partnerStore.findPartner(partnerId);
      if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

      const updated = {
        ...partner,
        status: status || partner.status,
        tierLevel: tierLevel || partner.tierLevel,
        notes: note || partner.notes,
        updatedAt: new Date().toISOString(),
      };
      await partnerStore.savePartner(updated);

      return NextResponse.json({
        success: true,
        message: `Partner ${partner.name} status updated to ${updated.status}.`,
        partner: updated,
      });
    }

    // Action 2: Process / Approve Payout
    if (action === "PROCESS_PAYOUT" && payoutId) {
      const payouts = await partnerStore.getPayouts();
      const targetPayout = payouts.find((p) => p.id === payoutId);
      if (!targetPayout) return NextResponse.json({ error: "Payout transaction not found" }, { status: 404 });

      const updatedPayout = {
        ...targetPayout,
        status: (status || "PAID") as any,
        processedAt: new Date().toISOString(),
        notes: note || targetPayout.notes,
      };
      await partnerStore.savePayout(updatedPayout);

      return NextResponse.json({
        success: true,
        message: `Payout batch ${targetPayout.reference} marked as ${updatedPayout.status}.`,
        payout: updatedPayout,
      });
    }

    return NextResponse.json({ error: "Invalid admin partner action." }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Partners POST Error]:", error);
    return NextResponse.json({ error: "Failed to process partner action" }, { status: 500 });
  }
}
