import { useQuery } from "@tanstack/react-query";
import type { Market } from "@/lib/types/market";

export type { Market };

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
  const response = await fetch("/api/kalshi?limit=100&active=true");
  if (!response.ok) {
    throw new Error("Failed to fetch markets");
  }
  return response.json();
}

export function useKalshiMarkets() {
  return useQuery({
    queryKey: ["kalshi-markets"],
    queryFn: fetchMarkets,
    staleTime: 60000,
    refetchInterval: 60000,
  });
}
