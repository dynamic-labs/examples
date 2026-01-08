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
    const params = new URLSearchParams({
      user,
      sizeThreshold: searchParams.get("sizeThreshold") || "0.01",
      limit: searchParams.get("limit") || "100",
      sortBy: searchParams.get("sortBy") || "CURRENT",
      sortDirection: searchParams.get("sortDirection") || "DESC",
    });

    // Add optional filters if provided
    const redeemable = searchParams.get("redeemable");
    if (redeemable) params.set("redeemable", redeemable);

    const mergeable = searchParams.get("mergeable");
    if (mergeable) params.set("mergeable", mergeable);

    const response = await fetch(
      `${POLYMARKET_DATA_API}/positions?${params}`,
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
    console.error("Position fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch positions", details: errorMessage },
      { status: 500 }
    );
  }
}

