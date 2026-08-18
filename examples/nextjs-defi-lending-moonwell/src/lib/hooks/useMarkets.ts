"use client";

import { useQuery } from "@tanstack/react-query";
import { MARKETS_API } from "@/lib/constants";
import {
  filterActiveMarkets,
  parseMarketsResponse,
  type Market,
} from "@/lib/moonwell";

async function fetchActiveMarkets(): Promise<Market[]> {
  const res = await fetch(MARKETS_API);
  if (!res.ok) {
    throw new Error(`Moonwell API returned ${res.status}`);
  }
  return filterActiveMarkets(parseMarketsResponse(await res.json()));
}

/** Live Base markets, deprecated ones already removed. */
export function useMarkets() {
  return useQuery({
    queryKey: ["moonwell", "markets"],
    queryFn: fetchActiveMarkets,
    staleTime: 30_000,
  });
}
