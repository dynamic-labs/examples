import { NextResponse } from "next/server";

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  close_time: string;
  expiration_time: string;
  category: string;
  result?: string;
  image_url?: string;
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

// Category mapping for display
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
};

function transformMarket(
  market: KalshiMarket,
  now: number
): TransformedMarket | null {
  try {
    // Calculate mid prices from bid/ask
    const yesPrice = ((market.yes_bid + market.yes_ask) / 2) * 100;
    const noPrice = ((market.no_bid + market.no_ask) / 2) * 100;

    // Normalize prices to sum to 100
    const total = yesPrice + noPrice;
    const normalizedYes = total > 0 ? (yesPrice / total) * 100 : 50;
    const normalizedNo = total > 0 ? (noPrice / total) * 100 : 50;

    // Map category
    const category =
      CATEGORY_MAP[market.category?.toLowerCase()] || market.category || "All";

    // Estimate traders from volume and open interest
    const yesTraders = Math.floor(market.open_interest * 0.45);
    const noTraders = Math.floor(market.open_interest * 0.35);

    // Generate tags
    const tags: string[] = [];
    const endTime = new Date(market.expiration_time).getTime();
    const hoursUntilEnd = (endTime - now) / (1000 * 60 * 60);

    if (hoursUntilEnd > 0 && hoursUntilEnd < 24) {
      tags.push("ending soon");
    }

    if (market.volume_24h > 10000) {
      tags.push("hot");
    }

    if (market.volume > 50000) {
      tags.push("trending");
    }

    if (market.open_interest > 100000) {
      tags.push("high stakes");
    }

    const priceDiff = Math.abs(normalizedYes - normalizedNo);
    if (priceDiff < 10) {
      tags.push("close call");
    }

    // Determine status
    let status: "open" | "closed" | "settled" = "open";
    if (market.result) {
      status = "settled";
    } else if (market.status === "closed" || endTime < now) {
      status = "closed";
    }

    return {
      id: market.ticker,
      question: market.title + (market.subtitle ? ` - ${market.subtitle}` : ""),
      endDate: market.expiration_time,
      yesPrice: normalizedYes.toFixed(1),
      noPrice: normalizedNo.toFixed(1),
      category,
      imageUrl: market.image_url || "",
      yesTraders,
      noTraders,
      ticker: market.ticker,
      tags,
      volume: market.volume,
      status,
    };
  } catch {
    return null;
  }
}

// Mock data for demonstration (Kalshi API requires authentication)
function getMockMarkets(): KalshiMarket[] {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return [
    {
      ticker: "PRES-2024-DEM",
      event_ticker: "PRES-2024",
      title: "Will the Democratic candidate win the 2024 presidential election?",
      status: "open",
      yes_bid: 0.52,
      yes_ask: 0.54,
      no_bid: 0.46,
      no_ask: 0.48,
      volume: 2500000,
      volume_24h: 150000,
      open_interest: 500000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "politics",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/politics.png",
    },
    {
      ticker: "BTC-100K-JAN",
      event_ticker: "BTC-PRICE",
      title: "Will Bitcoin reach $100,000 by end of January 2026?",
      status: "open",
      yes_bid: 0.35,
      yes_ask: 0.38,
      no_bid: 0.62,
      no_ask: 0.65,
      volume: 1800000,
      volume_24h: 95000,
      open_interest: 320000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "crypto",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/crypto.png",
    },
    {
      ticker: "FED-RATE-JAN",
      event_ticker: "FED-RATES",
      title: "Will the Fed cut interest rates in January 2026?",
      status: "open",
      yes_bid: 0.28,
      yes_ask: 0.31,
      no_bid: 0.69,
      no_ask: 0.72,
      volume: 950000,
      volume_24h: 45000,
      open_interest: 180000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "economics",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/economics.png",
    },
    {
      ticker: "NFL-SUPERBOWL",
      event_ticker: "NFL-2024",
      title: "Will the Kansas City Chiefs win Super Bowl LIX?",
      status: "open",
      yes_bid: 0.22,
      yes_ask: 0.25,
      no_bid: 0.75,
      no_ask: 0.78,
      volume: 3200000,
      volume_24h: 200000,
      open_interest: 650000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "sports",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/sports.png",
    },
    {
      ticker: "WEATHER-NYC-SNOW",
      event_ticker: "WEATHER-NYC",
      title: "Will NYC get more than 6 inches of snow tomorrow?",
      status: "open",
      yes_bid: 0.15,
      yes_ask: 0.18,
      no_bid: 0.82,
      no_ask: 0.85,
      volume: 125000,
      volume_24h: 35000,
      open_interest: 45000,
      close_time: tomorrow.toISOString(),
      expiration_time: tomorrow.toISOString(),
      category: "weather",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/weather.png",
    },
    {
      ticker: "ETH-5K-Q1",
      event_ticker: "ETH-PRICE",
      title: "Will Ethereum reach $5,000 in Q1 2026?",
      status: "open",
      yes_bid: 0.42,
      yes_ask: 0.45,
      no_bid: 0.55,
      no_ask: 0.58,
      volume: 890000,
      volume_24h: 55000,
      open_interest: 210000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "crypto",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/crypto.png",
    },
    {
      ticker: "OSCARS-BEST-PIC",
      event_ticker: "OSCARS-2026",
      title: "Will 'The Brutalist' win Best Picture at the 2026 Oscars?",
      status: "open",
      yes_bid: 0.31,
      yes_ask: 0.34,
      no_bid: 0.66,
      no_ask: 0.69,
      volume: 450000,
      volume_24h: 28000,
      open_interest: 95000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "entertainment",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/entertainment.png",
    },
    {
      ticker: "AI-GPT5-2026",
      event_ticker: "AI-RELEASES",
      title: "Will OpenAI release GPT-5 before July 2026?",
      status: "open",
      yes_bid: 0.58,
      yes_ask: 0.61,
      no_bid: 0.39,
      no_ask: 0.42,
      volume: 720000,
      volume_24h: 42000,
      open_interest: 165000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "technology",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/technology.png",
    },
    {
      ticker: "SP500-5500",
      event_ticker: "SP500-LEVELS",
      title: "Will S&P 500 close above 5,500 this week?",
      status: "open",
      yes_bid: 0.48,
      yes_ask: 0.51,
      no_bid: 0.49,
      no_ask: 0.52,
      volume: 1100000,
      volume_24h: 78000,
      open_interest: 280000,
      close_time: nextWeek.toISOString(),
      expiration_time: nextWeek.toISOString(),
      category: "finance",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/finance.png",
    },
    {
      ticker: "NBA-FINALS-CELTICS",
      event_ticker: "NBA-2025",
      title: "Will the Boston Celtics repeat as NBA Champions?",
      status: "open",
      yes_bid: 0.18,
      yes_ask: 0.21,
      no_bid: 0.79,
      no_ask: 0.82,
      volume: 1650000,
      volume_24h: 95000,
      open_interest: 380000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "sports",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/sports.png",
    },
    {
      ticker: "SOL-300-Q1",
      event_ticker: "SOL-PRICE",
      title: "Will Solana reach $300 in Q1 2026?",
      status: "open",
      yes_bid: 0.25,
      yes_ask: 0.28,
      no_bid: 0.72,
      no_ask: 0.75,
      volume: 560000,
      volume_24h: 38000,
      open_interest: 145000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "crypto",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/crypto.png",
    },
    {
      ticker: "UNEMPLOYMENT-4.5",
      event_ticker: "ECON-DATA",
      title: "Will US unemployment rate exceed 4.5% in January?",
      status: "open",
      yes_bid: 0.12,
      yes_ask: 0.15,
      no_bid: 0.85,
      no_ask: 0.88,
      volume: 380000,
      volume_24h: 22000,
      open_interest: 92000,
      close_time: nextMonth.toISOString(),
      expiration_time: nextMonth.toISOString(),
      category: "economics",
      image_url: "https://d1u5ehmvvpp8jp.cloudfront.net/economics.png",
    },
  ];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const active = searchParams.get("active") !== "false";
    const category = searchParams.get("category");

    // For now, use mock data since Kalshi API requires authentication
    // In production, you would call the actual Kalshi API:
    // const response = await fetch("https://trading-api.kalshi.com/trade-api/v2/markets", {
    //   headers: { Authorization: `Bearer ${process.env.KALSHI_API_KEY}` }
    // });

    const now = Date.now();
    let markets = getMockMarkets();

    // Filter by category if specified
    if (category && category !== "All") {
      markets = markets.filter(
        (m) => m.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter active markets
    if (active) {
      markets = markets.filter((m) => m.status === "open");
    }

    // Transform and sort markets
    const transformedMarkets = markets
      .map((market) => transformMarket(market, now))
      .filter((market): market is TransformedMarket => market !== null)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);

    return NextResponse.json(transformedMarkets, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch markets", details: errorMessage },
      { status: 500 }
    );
  }
}

