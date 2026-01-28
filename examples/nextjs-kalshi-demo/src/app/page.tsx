"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { MarketCard } from "@/components/MarketCard";
import { MarketStats } from "@/components/MarketStats";
import { SortSelect, type SortOption } from "@/components/SortSelect";
import {
  useKalshiMarkets,
  type Market,
  calculateTimeRemaining,
} from "@/lib/hooks/useKalshiMarkets";

export default function Home() {
  const [sortBy, setSortBy] = useState<SortOption>("volume");
  const { data: markets = [], isLoading, error } = useKalshiMarkets();

  const sortedMarkets = useMemo(() => {
    if (!markets.length) return [];

    return [...markets].sort((a, b) => {
      switch (sortBy) {
        case "ending-soon":
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case "newest":
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
        case "volume":
        default:
          return b.volume - a.volume;
      }
    });
  }, [markets, sortBy]);

  return (
    <>
      <Header />

      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <MarketStats markets={markets} />
        <div className="pt-[20px]">
          <SortSelect value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      <div className="pt-[20px] pb-[93px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="font-['Clash_Display',sans-serif] text-[18px] text-[rgba(221,226,246,0.3)]">
              Loading markets...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="font-['Clash_Display',sans-serif] text-[18px] text-[rgba(221,226,246,0.3)]">
              Error loading markets. Please try again later.
            </p>
          </div>
        ) : sortedMarkets.length > 0 ? (
          <div className="grid grid-cols-responsive gap-x-[20px] gap-y-[20px]">
            {sortedMarkets.map((market: Market) => (
              <MarketCard
                key={market.id}
                question={market.question}
                timeRemaining={calculateTimeRemaining(market.endDate)}
                yesPrice={market.yesPrice}
                noPrice={market.noPrice}
                imageUrl={market.imageUrl}
                yesTraders={market.yesTraders}
                noTraders={market.noTraders}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="font-['Clash_Display',sans-serif] text-[18px] text-[rgba(221,226,246,0.3)]">
              No markets found
            </p>
          </div>
        )}
      </div>
    </>
  );
}
