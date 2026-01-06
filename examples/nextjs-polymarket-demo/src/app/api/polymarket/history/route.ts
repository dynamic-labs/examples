import { NextRequest, NextResponse } from "next/server";

const POLYMARKET_DATA_API = "https://data-api.polymarket.com";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const user = searchParams.get("user");

  if (!user) {
    return NextResponse.json(
      { error: "User address is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch trade history from Polymarket Data API
    const params = new URLSearchParams({
      user,
      limit: searchParams.get("limit") || "50",
    });

    const response = await fetch(
      `${POLYMARKET_DATA_API}/activity?${params}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Polymarket API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch history", details: errorMessage },
      { status: 500 }
    );
  }
}

