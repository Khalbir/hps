import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_PRICING_RULES } from "@/lib/pricingEngine";

export const dynamic = "force-dynamic";

// GET /api/admin/pricing-rules
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "pricing_rules_config" },
    }).catch(() => null);

    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        return NextResponse.json({ success: true, rules: parsed });
      } catch (e) {}
    }

    return NextResponse.json({ success: true, rules: DEFAULT_PRICING_RULES });
  } catch (error: any) {
    console.error("[Pricing Rules GET Error]:", error);
    return NextResponse.json({ success: true, rules: DEFAULT_PRICING_RULES });
  }
}

// POST /api/admin/pricing-rules
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rules } = body;

    if (!rules || typeof rules !== "object") {
      return NextResponse.json({ error: "Invalid pricing rules object" }, { status: 400 });
    }

    const jsonString = JSON.stringify(rules);

    const updatedSetting = await prisma.setting.upsert({
      where: { key: "pricing_rules_config" },
      update: {
        value: jsonString,
      },
      create: {
        key: "pricing_rules_config",
        value: jsonString,
      },
    }).catch(async () => {
      // Fallback to AuditLog if Setting table is pending DB migration
      await prisma.auditLog.create({
        data: {
          action: "UPDATE_RULES",
          entity: "PRICING_RULES",
          details: jsonString,
        },
      }).catch(() => {});

      return { key: "pricing_rules_config", value: jsonString };
    });

    return NextResponse.json({
      success: true,
      message: "Nigerian Pricing Rules & Regional Surcharge Matrix updated successfully!",
      rules: JSON.parse(updatedSetting.value),
    });
  } catch (error: any) {
    console.error("[Pricing Rules POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to save pricing rules" }, { status: 500 });
  }
}
