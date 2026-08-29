import { NextResponse } from "next/server";
import { partnerStore } from "@/lib/partners/store";

export async function GET() {
  try {
    const config = await partnerStore.getConfig();
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error("[Admin Config GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch commission config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rates, tierMultipliers, payoutRules, updatedBy } = body;

    const updated = await partnerStore.updateConfig(
      {
        rates,
        tierMultipliers,
        payoutRules,
      },
      updatedBy || "ADMIN_CONSOLE"
    );

    return NextResponse.json({
      success: true,
      message: "Dynamic partner commission configuration updated successfully! All future calculations will reflect these rates.",
      config: updated,
    });
  } catch (error: any) {
    console.error("[Admin Config POST Error]:", error);
    return NextResponse.json({ error: "Failed to update commission config" }, { status: 500 });
  }
}
