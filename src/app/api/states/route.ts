import { NextResponse } from "next/server";
import { stateStore } from "@/lib/states/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get("all") === "true";
    const query = searchParams.get("q");

    if (includeAll) {
      const allStates = await stateStore.getAllStates();
      return NextResponse.json({
        success: true,
        states: allStates,
        total: allStates.length,
      });
    }

    if (query) {
      const matched = await stateStore.findState(query);
      return NextResponse.json({
        success: true,
        state: matched,
        isActive: Boolean(matched && matched.isActive),
      });
    }

    // Default: Return only ACTIVE operating states for public dropdowns & forms
    const activeStates = await stateStore.getActiveStates();

    const response = NextResponse.json({
      success: true,
      states: activeStates,
      total: activeStates.length,
    });

    // Cache active states on client & edge for fast access
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    return response;
  } catch (error: any) {
    console.error("[States GET API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch operating states" }, { status: 500 });
  }
}
