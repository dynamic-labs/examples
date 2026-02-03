"use client";

import { Header } from "@/components/Header";
import { MarketCard } from "@/components/MarketCard";
import {
  useKalshiMarkets,
  type Market,
  calculateTimeRemaining,
} from "@/lib/hooks/useKalshiMarkets";

export default function Home() {
  const { data: markets = [], isLoading, error } = useKalshiMarkets();

  return (
    <>
      <Header />

      {/* Market Cards Grid */}
      <div className="pt-[27px] pb-[93px]">
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
        ) : markets.length > 0 ? (
          <div className="grid grid-cols-responsive gap-x-[20px] gap-y-[20px]">
            {markets.map((market: Market) => (
              <MarketCard
                key={market.id}
                question={market.question}
                timeRemaining={calculateTimeRemaining(market.endDate)}
                yesPrice={market.yesPrice}
                noPrice={market.noPrice}
                category={market.category}
                imageUrl={market.imageUrl}
                yesTraders={market.yesTraders}
                noTraders={market.noTraders}
                ticker={market.ticker}
                yesTokenMint={market.yesTokenMint}
                noTokenMint={market.noTokenMint}
                marketId={market.id}
                tags={market.tags}
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

