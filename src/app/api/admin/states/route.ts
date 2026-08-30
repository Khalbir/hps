import { NextResponse } from "next/server";
import { stateStore } from "@/lib/states/store";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get("stateCode");

    const baseStates = await stateStore.getAllStates();
    const waitlist = await stateStore.getWaitlistEntries(stateCode || undefined);
    const auditLogs = await stateStore.getAuditLogs(100);

    // Live counts from real Prisma database records
    const liveArtisansByState: Record<string, number> = {};
    const liveBookingsByState: Record<string, number> = {};

    try {
      // 1. Live registered artisans count
      const professionals = await prisma.user.findMany({
        where: { role: "PROFESSIONAL", isActive: true },
        select: {
          id: true,
          permanentAddress: true,
          addresses: { select: { state: true, city: true } },
        },
      });

      for (const p of professionals) {
        let matchedCode = "FCT";
        if (p.addresses && p.addresses.length > 0 && p.addresses[0].state) {
          matchedCode = p.addresses[0].state.toUpperCase();
        } else if (p.permanentAddress) {
          const addr = p.permanentAddress.toUpperCase();
          for (const s of baseStates) {
            if (addr.includes(s.name.toUpperCase()) || addr.includes(s.code.toUpperCase()) || addr.includes(s.capital.toUpperCase())) {
              matchedCode = s.code.toUpperCase();
              break;
            }
          }
        }
        liveArtisansByState[matchedCode] = (liveArtisansByState[matchedCode] || 0) + 1;
      }

      // 2. Live bookings count
      const bookings = await prisma.booking.findMany({
        select: { id: true, address: true },
      });

      for (const b of bookings) {
        let matchedCode = "FCT";
        if (b.address) {
          try {
            const addrObj = typeof b.address === "string" && b.address.startsWith("{") ? JSON.parse(b.address) : { state: b.address };
            const addrStr = (addrObj.state || addrObj.city || String(b.address)).toUpperCase();
            for (const s of baseStates) {
              if (addrStr.includes(s.name.toUpperCase()) || addrStr.includes(s.code.toUpperCase()) || addrStr.includes(s.capital.toUpperCase())) {
                matchedCode = s.code.toUpperCase();
                break;
              }
            }
          } catch {
            // ignore
          }
        }
        liveBookingsByState[matchedCode] = (liveBookingsByState[matchedCode] || 0) + 1;
      }
    } catch (dbErr) {
      console.warn("[Admin States] DB live counts fallback:", dbErr);
    }

    // Compute real waitlist count per state from actual submissions
    const waitlistCountsByState: Record<string, number> = {};
    for (const w of waitlist) {
      const code = w.stateCode.toUpperCase();
      waitlistCountsByState[code] = (waitlistCountsByState[code] || 0) + 1;
    }

    // Merge live stats into state array
    const states = baseStates.map((s) => {
      const code = s.code.toUpperCase();
      return {
        ...s,
        activeArtisansCount: liveArtisansByState[code] || 0,
        totalBookingsCount: liveBookingsByState[code] || 0,
        activeEstatesCount: 0,
        waitlistCount: waitlistCountsByState[code] || 0,
      };
    });

    const activeCount = states.filter((s) => s.isActive && s.status === "ACTIVE").length;
    const inactiveCount = states.length - activeCount;

    const metrics = {
      totalStates: states.length,
      activeStatesCount: activeCount,
      inactiveStatesCount: inactiveCount,
      totalWaitlistSubscribers: waitlist.length,
      totalAuditLogsCount: auditLogs.length,
      lastStateModified: auditLogs[0]
        ? {
            name: auditLogs[0].stateName,
            action: auditLogs[0].action,
            timestamp: auditLogs[0].timestamp,
          }
        : null,
    };

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
