/**
 * Pure domain logic for the Moonwell markets API and mToken accounting.
 * Everything here is framework-free and unit tested in `moonwell.test.ts`.
 */

export interface Market {
  /** Underlying asset symbol, e.g. "USDC". */
  asset: string;
  assetAddress: string;
  /** mToken symbol. NOT unique — both USDC and legacy USDbC report "mUSDC". */
  mToken: string;
  /** The stable identifier for a market. */
  mTokenAddress: string;
  deprecated: boolean;
  /** Already a percentage: 4.3861606852 means 4.39%. */
  baseSupplyApy: number;
  baseBorrowApy: number;
  /** Supply APY including protocol rewards, also a percentage. */
  totalSupplyApr: number;
  totalBorrowApr: number;
  totalSupplyUsd: number;
  totalBorrowsUsd: number;
  liquidityUsd: number;
  utilization: number;
  collateralFactor: number;
}

const NUMBER_FIELDS = [
  "baseSupplyApy",
  "baseBorrowApy",
  "totalSupplyApr",
  "totalBorrowApr",
  "totalSupplyUsd",
  "totalBorrowsUsd",
  "liquidityUsd",
  "utilization",
  "collateralFactor",
] as const;

const STRING_FIELDS = [
  "asset",
  "assetAddress",
  "mToken",
  "mTokenAddress",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMarket(value: unknown): value is Market {
  if (!isRecord(value)) return false;
  if (typeof value.deprecated !== "boolean") return false;
  return (
    STRING_FIELDS.every((f) => typeof value[f] === "string") &&
    NUMBER_FIELDS.every((f) => typeof value[f] === "number")
  );
}

/**
 * Runtime guard over the markets endpoint. The response is
 * `{ success, data: Market[], meta }`; anything else is a hard error rather
 * than a silently empty market list.
 */
export function parseMarketsResponse(payload: unknown): Market[] {
  if (!isRecord(payload)) {
    throw new Error("Moonwell API: expected a JSON object");
  }
  if (payload.success !== true) {
    throw new Error("Moonwell API: response success flag was not true");
  }
  if (!Array.isArray(payload.data)) {
    throw new Error("Moonwell API: expected data to be an array");
  }
  if (!payload.data.every(isMarket)) {
    throw new Error("Moonwell API: a market is missing required fields");
  }
  return payload.data;
}

/** Deprecated markets are read-only husks — never show or target them. */
export function filterActiveMarkets(markets: Market[]): Market[] {
  return markets.filter((market) => !market.deprecated);
}

/** Markets are identified by mToken address because symbols collide. */
export function findMarketByMToken(
  markets: Market[],
  mTokenAddress: string,
): Market | undefined {
  const needle = mTokenAddress.toLowerCase();
  return markets.find((m) => m.mTokenAddress.toLowerCase() === needle);
}

/**
 * Converts an mToken balance into the underlying asset's smallest unit.
 *
 * `exchangeRateStored` is scaled by 1e(10 + underlyingDecimals), so dividing
 * the product by 1e18 lands in underlying units for any market, regardless of
 * the underlying's decimals. Truncating division rounds in the protocol's
 * favour, which is what we want when displaying a redeemable balance.
 */
export function underlyingFromMTokens(
  mTokenBalance: bigint,
  exchangeRateStored: bigint,
): bigint {
  return (mTokenBalance * exchangeRateStored) / 10n ** 18n;
}

/**
 * Formats a token amount for display, to cents.
 *
 * Rounds half-up in bigint arithmetic rather than going through `Number` —
 * `(1.005).toFixed(2)` is `"1.00"`, because 1.005 has no exact binary
 * representation. Balances are money, so they round by the stated rule and not
 * by whichever float happens to be nearest.
 *
 * A nonzero balance never reads as "0.00": the Max button offers full
 * precision, so a card showing 0.00 while Max offers something is a
 * contradiction the user cannot resolve.
 */
export function formatUsdcAmount(value: bigint, decimals = 6): string {
  if (value === 0n) return "0.00";
  const scale = 10n ** BigInt(decimals);
  const cents = (value * 100n + scale / 2n) / scale;
  if (cents === 0n) return "<0.01";
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

/** API APY values are already percentages. */
export function formatApy(apy: number): string {
  if (!Number.isFinite(apy)) return "—";
  return `${apy.toFixed(2)}%`;
}

/**
 * Full asset names as shown on moonwell.fi. The markets API returns symbols
 * only, and the app pairs each symbol with its name in the market list.
 */
const ASSET_NAMES: Record<string, string> = {
  AERO: "Aerodrome",
  DAI: "Dai",
  ETH: "Ethereum",
  EURC: "Euro Coin",
  LBTC: "Lombard Staked Bitcoin",
  MAMO: "Mamo",
  MORPHO: "Morpho",
  USDC: "USD Coin",
  USDS: "Sky Dollar",
  VIRTUAL: "Virtuals Protocol",
  WELL: "Moonwell",
  cbBTC: "Coinbase Bitcoin",
  cbETH: "Coinbase Staked Ethereum",
  cbXRP: "Coinbase XRP",
  rETH: "Rocket Pool Staked Ethereum",
  tBTC: "Threshold Bitcoin",
  weETH: "EtherFi Restaked Ethereum",
  wrsETH: "KelpDAO Restaked Ethereum",
  wstETH: "Lido Staked Ethereum",
};

/** Falls back to the symbol for any asset listed after this map was written. */
export function assetDisplayName(symbol: string): string {
  return ASSET_NAMES[symbol] ?? symbol;
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
