import { NextResponse } from "next/server";
import { getCachedAutocompleteSuggestions } from "@/lib/location";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await getCachedAutocompleteSuggestions(q);
    return NextResponse.json({
      query: q,
      cacheHit: true,
      suggestions,
    });
  } catch (error) {
    console.error("[Autocomplete API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch autocomplete suggestions" },
      { status: 500 }
    );
  }
}
