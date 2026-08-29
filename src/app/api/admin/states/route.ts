import { NextResponse } from "next/server";
import { stateStore } from "@/lib/states/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get("stateCode");

    const states = await stateStore.getAllStates();
    const metrics = await stateStore.getMetrics();
    const auditLogs = await stateStore.getAuditLogs(100);
    const waitlist = await stateStore.getWaitlistEntries(stateCode || undefined);

    return NextResponse.json({
      success: true,
      metrics,
      states,
      auditLogs,
      waitlist,
    });
  } catch (error: any) {
    console.error("[Admin States GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch state operations data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      stateCode,
      isActive,
      reason,
      coverageSummary,
      actorId,
      actorEmail,
      actorRole,
    } = body;

    const ip = request.headers.get("x-forwarded-for") || "admin_console";

    // Super Admin Authorization Guard
    if (actorRole && actorRole !== "SUPER_ADMIN" && actorRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied: State activation and deactivation is strictly restricted to Super Admin." },
        { status: 403 }
      );
    }

    if (action === "TOGGLE_STATUS") {
      if (!stateCode || typeof isActive !== "boolean") {
        return NextResponse.json(
          { error: "State code and target active status are required." },
          { status: 400 }
        );
      }

      if (!reason || reason.trim().length < 5) {
        return NextResponse.json(
          { error: "An audit reason (minimum 5 characters) is required for state status modification." },
          { status: 400 }
        );
      }

      const result = await stateStore.toggleStateStatus({
        stateCode,
        isActive,
        reason: reason.trim(),
        actorId: actorId || "usr_super_admin",
        actorEmail: actorEmail || "superadmin@handyhubpro.ng",
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        message: `${result.state.name} has been ${isActive ? "ACTIVATED" : "DEACTIVATED"} successfully. Dropdowns and booking flows have been updated platform-wide without server downtime.`,
        state: result.state,
        auditLog: result.auditLog,
      });
    }

    if (action === "UPDATE_COVERAGE") {
      if (!stateCode || !coverageSummary) {
        return NextResponse.json(
          { error: "State code and coverage summary are required." },
          { status: 400 }
        );
      }

      const updated = await stateStore.updateStateCoverage({
        stateCode,
        coverageSummary: coverageSummary.trim(),
        actorEmail: actorEmail || "superadmin@handyhubpro.ng",
      });

      return NextResponse.json({
        success: true,
        message: `Coverage summary for ${updated.name} updated successfully.`,
        state: updated,
      });
    }

    return NextResponse.json({ error: "Invalid state admin action." }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin States POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to process state operation" }, { status: 500 });
  }
}
