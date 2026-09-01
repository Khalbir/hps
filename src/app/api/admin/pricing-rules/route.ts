import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_PRICING_RULES } from "@/lib/pricingEngine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let inMemoryRulesConfig: any = null;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

// GET /api/admin/pricing-rules
export async function GET() {
  try {
    // 1. Try DB Setting table first for true live source of truth
    const setting = await prisma.setting.findUnique({
      where: { key: "pricing_rules_config" },
    }).catch(() => null);

    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        inMemoryRulesConfig = parsed;
        return NextResponse.json({ success: true, rules: parsed }, { headers: NO_CACHE_HEADERS });
      } catch (e) {}
    }

    // 2. Check in-memory cache as fallback
    if (inMemoryRulesConfig) {
      return NextResponse.json({ success: true, rules: inMemoryRulesConfig }, { headers: NO_CACHE_HEADERS });
    }

    // 3. Fallback: Check AuditLog table for latest UPDATE_RULES entry
    const audit = await prisma.auditLog.findFirst({
      where: { action: "UPDATE_RULES", entity: "PRICING_RULES" },
      orderBy: { createdAt: "desc" },
    }).catch(() => null);

    if (audit?.details) {
      try {
        const parsed = JSON.parse(audit.details);
        inMemoryRulesConfig = parsed;
        return NextResponse.json({ success: true, rules: parsed }, { headers: NO_CACHE_HEADERS });
      } catch (e) {}
    }

    return NextResponse.json({ success: true, rules: DEFAULT_PRICING_RULES }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error("[Pricing Rules GET Error]:", error);
    return NextResponse.json({ success: true, rules: inMemoryRulesConfig || DEFAULT_PRICING_RULES }, { headers: NO_CACHE_HEADERS });
  }
}

// POST /api/admin/pricing-rules
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rules, action } = body;

    let targetRules = rules;

    if (action === "RESET") {
      targetRules = DEFAULT_PRICING_RULES;
    }

    if (!targetRules || typeof targetRules !== "object") {
      return NextResponse.json({ error: "Invalid pricing rules object" }, { status: 400 });
    }

    // Update in-memory cache immediately
    inMemoryRulesConfig = targetRules;
    const jsonString = JSON.stringify(targetRules);

    // Save to Setting table & AuditLog table
    await prisma.setting.upsert({
      where: { key: "pricing_rules_config" },
      update: { value: jsonString },
      create: { key: "pricing_rules_config", value: jsonString },
    }).catch(async () => {
      // Fallback: save to AuditLog table
      await prisma.auditLog.create({
        data: {
          action: "UPDATE_RULES",
          entity: "PRICING_RULES",
          details: jsonString,
        },
      }).catch(() => {});
    });

    return NextResponse.json(
      {
        success: true,
        message: "Executive pricing adjustments saved & published live!",
        rules,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("[Pricing Rules POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to save pricing rules" }, { status: 500 });
  }
}
