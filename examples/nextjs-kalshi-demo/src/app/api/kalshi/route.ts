import { NextResponse } from "next/server";
import { env } from "@/env";
import { DFLOW_METADATA_API_URL, USDC_MINT } from "@/lib/constants";
import { checkGeoBlocking } from "@/lib/api-geo-blocking";
import type { DFlowMarket, Market } from "@/lib/types/market";

function getDFlowHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (env.DFLOW_API_KEY) {
    headers["x-api-key"] = env.DFLOW_API_KEY;
  }
  return headers;
}

function parsePrice(price: string | null | undefined): number | null {
  if (!price) return null;
  const parsed = parseFloat(price);
  return isNaN(parsed) ? null : parsed * 100;
}

function transformMarket(market: DFlowMarket, now: number): Market | null {
  const usdcAccount = market.accounts?.[USDC_MINT];
  const firstAccount = usdcAccount || Object.values(market.accounts || {})[0];
  if (!firstAccount) return null;

  const yesPrice = parsePrice(market.yesAsk) ?? parsePrice(market.yesBid) ?? 50;
  const noPrice =
    parsePrice(market.noAsk) ?? parsePrice(market.noBid) ?? 100 - yesPrice;

  const openInterest = market.openInterest || 0;
  const volume = market.volume || 0;
  const endTime = market.expirationTime
    ? market.expirationTime * 1000
    : now + 30 * 24 * 60 * 60 * 1000;

  return {
    id: market.id || market.ticker,
    question: market.title + (market.subtitle ? ` - ${market.subtitle}` : ""),
    endDate: new Date(endTime).toISOString(),
    yesPrice: yesPrice.toFixed(1),
    noPrice: noPrice.toFixed(1),
    imageUrl: market.imageUrl || "",
    yesTraders: Math.floor(openInterest * 0.45),
    noTraders: Math.floor(openInterest * 0.35),
    volume,
  };
}

async function fetchMarkets(activeOnly = false): Promise<DFlowMarket[]> {
  const url = new URL(`${DFLOW_METADATA_API_URL}/api/v1/markets`);
  if (activeOnly) url.searchParams.append("status", "active");
  url.searchParams.append("limit", "100");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getDFlowHeaders(),
    next: { revalidate: 60 },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.markets || [];
}

export async function GET(request: Request) {
  const geoBlockResponse = checkGeoBlocking(request);
  if (geoBlockResponse) return geoBlockResponse;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const active = searchParams.get("active") !== "false";

    const now = Date.now();
    let markets = await fetchMarkets(active);

    if (active) {
      const activeMarkets = markets.filter(
        (m) =>
          m.status === "active" ||
          m.status === "initialized" ||
          (m.status !== "determined" &&
            m.status !== "closed" &&
            m.result !== "yes" &&
            m.result !== "no")
      );
      if (activeMarkets.length > 0) markets = activeMarkets;
    }

    const transformed = markets
      .map((m) => transformMarket(m, now))
      .filter((m): m is Market => m !== null)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);

    return NextResponse.json(transformed, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[Markets] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
