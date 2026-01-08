import { useQuery } from "@tanstack/react-query";

export interface Market {
  id: string;
  question: string;
  endDate: string;
  yesPrice: string;
  noPrice: string;
  category: string;
  imageUrl: string;
  yesTraders: number;
  noTraders: number;
  conditionId: string;
  yesTokenId?: string;
  noTokenId?: string;
  tags: string[];
  volume: number;
}

// Calculate time remaining on client side
export function calculateTimeRemaining(endDate: string): string {
  try {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) {
      return "Closed";
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  } catch {
    return "Unknown";
  }
}

async function fetchMarkets(): Promise<Market[]> {
  const response = await fetch("/api/polymarket?limit=100&active=true");
  if (!response.ok) {
    throw new Error("Failed to fetch markets");
  }
  return response.json();
}

export function usePolymarketMarkets() {
  return useQuery({
    queryKey: ["polymarket-markets"],
    queryFn: fetchMarkets,
    staleTime: 60000,
    refetchInterval: 60000,
  });
}
