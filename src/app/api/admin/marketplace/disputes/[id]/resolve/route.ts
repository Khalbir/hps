import { NextResponse } from "next/server";
import { resolveMarketplaceDispute } from "@/lib/disputes";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { resolution, resolutionNotes, refundAmount, adminId } = body;

    if (!resolution || !resolutionNotes) {
      return NextResponse.json(
        { error: "Resolution decision and resolution notes are required." },
        { status: 400 }
      );
    }

    const result = await resolveMarketplaceDispute({
      disputeId: id,
      resolution,
      resolutionNotes,
      refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
      adminId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Dispute resolved with decision: ${resolution}`,
      dispute: result.dispute,
    });
  } catch (error: any) {
    console.error("[Admin Resolve Dispute API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve dispute." },
      { status: 500 }
    );
  }
}
