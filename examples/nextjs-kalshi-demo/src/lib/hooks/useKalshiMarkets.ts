import { useQuery } from "@tanstack/react-query";
import type { Market } from "@/lib/types/market";

// Re-export Market type for consumers
export type { Market };

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

async function fetchMarkets(category?: string): Promise<Market[]> {
  const params = new URLSearchParams({ limit: "100", active: "true" });
  if (category && category !== "All") {
    params.set("category", category);
  }

  const response = await fetch(`/api/kalshi?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch markets");
  }
  return response.json();
}

export function useKalshiMarkets(category?: string) {
  return useQuery({
    queryKey: ["kalshi-markets", category],
    queryFn: () => fetchMarkets(category),
    staleTime: 60000,
    refetchInterval: 60000,
  });
}
