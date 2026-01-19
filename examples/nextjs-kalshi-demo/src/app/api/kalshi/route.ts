import { NextResponse } from "next/server";
import { env } from "@/env";
import { DFLOW_METADATA_API_URL, USDC_MINT } from "@/lib/constants";

const CATEGORY_MAP: Record<string, string> = {
  politics: "Politics",
  economics: "Economics",
  science: "Science",
  sports: "Sports",
  entertainment: "Entertainment",
  crypto: "Crypto",
  weather: "Weather",
  culture: "Culture",
  technology: "Technology",
  finance: "Finance",
  news: "News",
  pop_culture: "Pop Culture",
};

interface DFlowMarketAccount {
  yesMint: string;
  noMint: string;
  marketLedger: string;
  redemptionStatus: string;
  scalarOutcomePct?: number;
}

interface DFlowMarket {
  id: string;
  title: string;
  subtitle?: string;
  ticker: string;
  category: string;
  status: string;
  result: string;
  accounts: Record<string, DFlowMarketAccount>;
  yesBid?: string | null;
  yesAsk?: string | null;
  noBid?: string | null;
  noAsk?: string | null;
  volume?: number;
  openInterest?: number;
  openTime?: number;
  closeTime?: number;
  expirationTime?: number;
  imageUrl?: string;
}

interface TransformedMarket {
  id: string;
  question: string;
  endDate: string;
  yesPrice: string;
  noPrice: string;
  category: string;
  imageUrl: string;
  yesTraders: number;
  noTraders: number;
  ticker: string;
  yesTokenMint?: string;
  noTokenMint?: string;
  tags: string[];
  volume: number;
  status: "open" | "closed" | "settled";
}

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

function transformDFlowMarket(
  market: DFlowMarket,
  now: number
): TransformedMarket | null {
  try {
    const usdcAccount = market.accounts?.[USDC_MINT];
    const firstAccount = usdcAccount || Object.values(market.accounts || {})[0];

    if (!firstAccount) return null;

    const yesPrice =
      parsePrice(market.yesAsk) ?? parsePrice(market.yesBid) ?? 50;
    const noPrice =
      parsePrice(market.noAsk) ?? parsePrice(market.noBid) ?? 100 - yesPrice;

    const category =
      CATEGORY_MAP[market.category?.toLowerCase()] || market.category || "All";

    const openInterest = market.openInterest || 0;
    const yesTraders = Math.floor(openInterest * 0.45);
    const noTraders = Math.floor(openInterest * 0.35);

    const tags: string[] = [];
    const endTime = market.expirationTime
      ? market.expirationTime * 1000
      : now + 30 * 24 * 60 * 60 * 1000;
    const hoursUntilEnd = (endTime - now) / (1000 * 60 * 60);

    if (hoursUntilEnd > 0 && hoursUntilEnd < 24) tags.push("ending soon");

    const volume = market.volume || 0;
    if (volume > 10000) tags.push("hot");
    if (volume > 50000) tags.push("trending");
    if (openInterest > 100000) tags.push("high stakes");

    const priceDiff = Math.abs(yesPrice - noPrice);
    if (priceDiff < 10) tags.push("close call");

    let status: "open" | "closed" | "settled" = "open";
    if (market.result && market.result !== "") {
      status = "settled";
    } else if (
      market.status === "closed" ||
      market.status === "determined" ||
      market.status === "finalized"
    ) {
      status = "closed";
    }

    return {
      id: market.id || market.ticker,
      question: market.title + (market.subtitle ? ` - ${market.subtitle}` : ""),
      endDate: market.expirationTime
        ? new Date(market.expirationTime * 1000).toISOString()
        : new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
      yesPrice: yesPrice.toFixed(1),
      noPrice: noPrice.toFixed(1),
      category,
      imageUrl: market.imageUrl || "",
      yesTraders,
      noTraders,
      ticker: market.ticker || market.id,
      yesTokenMint: firstAccount.yesMint,
      noTokenMint: firstAccount.noMint,
      tags,
      volume,
      status,
    };
  } catch {
    return null;
  }
}

async function fetchDFlowMarkets(activeOnly = false): Promise<DFlowMarket[]> {
  try {
    const url = new URL(`${DFLOW_METADATA_API_URL}/api/v1/markets`);
    if (activeOnly) {
      url.searchParams.append("status", "active");
    }
    url.searchParams.append("limit", "100");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: getDFlowHeaders(),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error("[Markets] DFlow API error:", response.status);
      return [];
    }

    const data = await response.json();
    return data.markets || [];
  } catch (error) {
    console.error("[Markets] Fetch error:", error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const active = searchParams.get("active") !== "false";
    const category = searchParams.get("category");

    const now = Date.now();
    let markets = await fetchDFlowMarkets(active);

    if (category && category !== "All") {
      markets = markets.filter(
        (m) => m.category?.toLowerCase() === category.toLowerCase()
      );
    }

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
      if (activeMarkets.length > 0) {
        markets = activeMarkets;
      }
    }

    const transformedMarkets = markets
      .map((market) => transformDFlowMarket(market, now))
      .filter((market): market is TransformedMarket => market !== null)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);

    return NextResponse.json(transformedMarkets, {
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
