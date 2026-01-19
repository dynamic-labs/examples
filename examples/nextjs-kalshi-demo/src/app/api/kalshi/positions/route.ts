import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { Position } from "@/lib/types/market";
import { env } from "@/env";
import { DFLOW_METADATA_API_URL, SOLANA_RPC_URL } from "@/lib/constants";

interface TokenBalance {
  mint: string;
  rawBalance: string;
  balance: number;
  decimals: number;
}

interface MarketAccount {
  yesMint: string;
  noMint: string;
  marketLedger: string;
  redemptionStatus: "open" | "pending" | "closed";
  scalarOutcomePct?: number;
}

interface MarketData {
  id: string;
  title: string;
  subtitle?: string;
  ticker: string;
  category: string;
  status: "open" | "active" | "closed" | "determined" | "finalized";
  result: "yes" | "no" | "";
  accounts: Record<string, MarketAccount>;
  yesPrice?: number;
  noPrice?: number;
  volume?: number;
  imageUrl?: string;
}

function getDFlowHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (env.DFLOW_API_KEY) {
    headers["x-api-key"] = env.DFLOW_API_KEY;
  }
  return headers;
}

async function fetchUserTokenAccounts(
  connection: Connection,
  walletAddress: string
): Promise<TokenBalance[]> {
  const userWallet = new PublicKey(walletAddress);

  const [splTokenAccounts, token2022Accounts] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(userWallet, {
      programId: TOKEN_PROGRAM_ID,
    }),
    connection.getParsedTokenAccountsByOwner(userWallet, {
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  ]);

  const allAccounts = [...splTokenAccounts.value, ...token2022Accounts.value];

  return allAccounts
    .map(({ account }) => {
      const info = account.data.parsed.info;
      return {
        mint: info.mint as string,
        rawBalance: info.tokenAmount.amount as string,
        balance: info.tokenAmount.uiAmount as number,
        decimals: info.tokenAmount.decimals as number,
      };
    })
    .filter((t) => t.balance > 0);
}

async function filterOutcomeMints(mintAddresses: string[]): Promise<string[]> {
  if (mintAddresses.length === 0) return [];

  const response = await fetch(
    `${DFLOW_METADATA_API_URL}/api/v1/filter_outcome_mints`,
    {
      method: "POST",
      headers: getDFlowHeaders(),
      body: JSON.stringify({ addresses: mintAddresses }),
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return data.outcomeMints || [];
}

async function fetchMarketsBatch(
  predictionMintAddresses: string[]
): Promise<MarketData[]> {
  if (predictionMintAddresses.length === 0) return [];

  const response = await fetch(
    `${DFLOW_METADATA_API_URL}/api/v1/markets/batch`,
    {
      method: "POST",
      headers: getDFlowHeaders(),
      body: JSON.stringify({ mints: predictionMintAddresses }),
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return data.markets || [];
}

function buildPositions(
  outcomeTokens: TokenBalance[],
  markets: MarketData[]
): Position[] {
  const marketsByMint = new Map<string, MarketData>();

  markets.forEach((market) => {
    if (market.accounts) {
      Object.values(market.accounts).forEach((account) => {
        if (account.yesMint) marketsByMint.set(account.yesMint, market);
        if (account.noMint) marketsByMint.set(account.noMint, market);
      });
    }
  });

  return outcomeTokens
    .map((token): Position | null => {
      const marketData = marketsByMint.get(token.mint);
      if (!marketData) return null;

      let isYesToken = false;
      let isNoToken = false;
      let settlementMint: string | undefined;
      let redemptionStatus: "open" | "pending" | "closed" | undefined;
      let scalarOutcomePct: number | undefined;

      if (marketData.accounts) {
        for (const [mint, account] of Object.entries(marketData.accounts)) {
          if (account.yesMint === token.mint) {
            isYesToken = true;
            settlementMint = mint;
            redemptionStatus = account.redemptionStatus;
            scalarOutcomePct = account.scalarOutcomePct;
            break;
          } else if (account.noMint === token.mint) {
            isNoToken = true;
            settlementMint = mint;
            redemptionStatus = account.redemptionStatus;
            scalarOutcomePct = account.scalarOutcomePct;
            break;
          }
        }
      }

      const side = isYesToken ? "yes" : isNoToken ? "no" : null;
      if (!side) return null;

      const currentPrice =
        side === "yes" ? marketData.yesPrice ?? 50 : marketData.noPrice ?? 50;

      let isRedeemable = false;
      if (
        redemptionStatus === "open" &&
        (marketData.status === "determined" ||
          marketData.status === "finalized")
      ) {
        if (
          (marketData.result === "yes" && side === "yes") ||
          (marketData.result === "no" && side === "no")
        ) {
          isRedeemable = true;
        } else if (
          marketData.result === "" &&
          scalarOutcomePct !== null &&
          scalarOutcomePct !== undefined
        ) {
          isRedeemable = true;
        }
      }

      const estimatedEntryPrice = 50;
      const pnl = ((currentPrice - estimatedEntryPrice) * token.balance) / 100;
      const pnlPercent =
        ((currentPrice - estimatedEntryPrice) / estimatedEntryPrice) * 100;

      return {
        marketId: marketData.id || token.mint,
        ticker: marketData.ticker || "UNKNOWN",
        question: marketData.title || "Unknown Market",
        side,
        size: token.balance,
        avgPrice: estimatedEntryPrice,
        currentPrice,
        pnl,
        pnlPercent,
        outcomeMint: token.mint,
        settlementMint,
        marketStatus: marketData.status,
        isRedeemable,
        redemptionStatus,
        result: marketData.result,
        scalarOutcomePct,
        category: marketData.category,
        imageUrl: marketData.imageUrl,
      };
    })
    .filter((p): p is Position => p !== null);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    try {
      new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const connection = new Connection(SOLANA_RPC_URL, "confirmed");
    const userTokens = await fetchUserTokenAccounts(connection, walletAddress);

    if (userTokens.length === 0) {
      return NextResponse.json({ positions: [], orders: [] });
    }

    const allMintAddresses = userTokens.map((token) => token.mint);
    const predictionMintAddresses = await filterOutcomeMints(allMintAddresses);

    if (predictionMintAddresses.length === 0) {
      return NextResponse.json({ positions: [], orders: [] });
    }

    const outcomeTokens = userTokens.filter((token) =>
      predictionMintAddresses.includes(token.mint)
    );

    const markets = await fetchMarketsBatch(predictionMintAddresses);
    const positions = buildPositions(outcomeTokens, markets);

    return NextResponse.json({ positions, orders: [] });
  } catch (error) {
    console.error("[Positions] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
