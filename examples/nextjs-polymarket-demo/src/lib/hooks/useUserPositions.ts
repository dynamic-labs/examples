import { useQuery } from "@tanstack/react-query";

export interface PolymarketPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
}

interface UseUserPositionsOptions {
  sizeThreshold?: number;
  limit?: number;
  sortBy?:
    | "CURRENT"
    | "INITIAL"
    | "TOKENS"
    | "CASHPNL"
    | "PERCENTPNL"
    | "TITLE"
    | "RESOLVING"
    | "PRICE"
    | "AVGPRICE";
  sortDirection?: "ASC" | "DESC";
  redeemable?: boolean;
}

async function fetchPositions(
  walletAddress: string,
  options: UseUserPositionsOptions
): Promise<PolymarketPosition[]> {
  const params = new URLSearchParams({
    user: walletAddress,
  });

  if (options.sizeThreshold !== undefined) {
    params.set("sizeThreshold", options.sizeThreshold.toString());
  }
  if (options.limit !== undefined) {
    params.set("limit", options.limit.toString());
  }
  if (options.sortBy) {
    params.set("sortBy", options.sortBy);
  }
  if (options.sortDirection) {
    params.set("sortDirection", options.sortDirection);
  }
  if (options.redeemable !== undefined) {
    params.set("redeemable", options.redeemable.toString());
  }

  const response = await fetch(`/api/polymarket/positions?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch positions");
  }

  return response.json();
}

export function useUserPositions(
  walletAddress: string | undefined,
  options: UseUserPositionsOptions = {}
) {
  return useQuery({
    queryKey: ["polymarket-positions", walletAddress, options],
    queryFn: () => fetchPositions(walletAddress!, options),
    enabled: !!walletAddress,
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
}
