import { useQuery } from "@tanstack/react-query";
import type { ClobClient } from "@polymarket/clob-client";

export interface PolymarketOrder {
  id: string;
  status: string;
  owner: string;
  maker_address: string;
  market: string;
  asset_id: string;
  side: "BUY" | "SELL";
  original_size: string;
  size_matched: string;
  price: string;
  associate_trades: string[];
  outcome: string;
  created_at: number;
  expiration: string;
  order_type: string;
}

export function useActiveOrders(
  clobClient: ClobClient | null,
  walletAddress: string | undefined
) {
  return useQuery({
    queryKey: ["active-orders", walletAddress],
    queryFn: async (): Promise<PolymarketOrder[]> => {
      if (!clobClient || !walletAddress) {
        return [];
      }

      try {
        const allOrders = await clobClient.getOpenOrders();

        const activeOrders = (allOrders as PolymarketOrder[]).filter(
          (order) =>
            order.maker_address?.toLowerCase() ===
              walletAddress.toLowerCase() && order.status === "LIVE"
        );

        return activeOrders;
      } catch (err) {
        console.error("Error fetching open orders:", err);
        return [];
      }
    },
    enabled: !!clobClient && !!walletAddress,
    staleTime: 2000,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
