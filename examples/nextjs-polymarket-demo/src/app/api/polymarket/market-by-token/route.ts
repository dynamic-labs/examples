import { NextRequest, NextResponse } from "next/server";

const GAMMA_API = "https://gamma-api.polymarket.com";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tokenId = searchParams.get("tokenId");

  if (!tokenId) {
    return NextResponse.json(
      { error: "Token ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch market data from Gamma API using the token ID
    const response = await fetch(
      `${GAMMA_API}/markets?clob_token_ids=${tokenId}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the first matching market
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data[0], {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    return NextResponse.json(
      { error: "Market not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Market fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch market", details: errorMessage },
      { status: 500 }
    );
  }
}

