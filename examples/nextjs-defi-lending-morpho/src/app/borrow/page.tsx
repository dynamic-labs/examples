"use client";

import { useMarketsList } from "@/lib/hooks";
import { useAccount } from "wagmi";
import { MarketCard } from "../../components";

export default function BorrowPage() {
  const { isConnected } = useAccount();
  const {
    markets,
    loading: marketsLoading,
    error: marketsError,
  } = useMarketsList();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <h1 className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-br from-white to-blue-400 bg-clip-text text-transparent">
        Borrow
      </h1>

      <div className="mb-12">
        <p className="text-xl text-center text-gray-400 leading-relaxed">
          Choose a market to start borrowing against your collateral
        </p>
      </div>

      {marketsLoading && (
        <div className="mt-8 p-8 bg-gray-700 rounded-xl text-center text-gray-400 text-base">
          Loading markets...
        </div>
      )}

      {marketsError && (
        <div className="mt-8 p-4 bg-red-500/10 rounded-lg text-center text-red-500 border border-red-500">
          Error loading markets: {marketsError}
        </div>
      )}

      {!marketsLoading && !marketsError && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {markets.length > 0 ? (
            markets
              .map((market) => <MarketCard key={market.id} market={market} />)
              .filter(Boolean)
          ) : (
            <div className="mt-8 p-8 bg-gray-700 rounded-xl text-center text-gray-400 text-base">
              No markets available at the moment.
            </div>
          )}
        </div>
      )}

      {!isConnected && (
        <div className="mt-8 p-4 bg-yellow-500/10 rounded-lg text-center text-yellow-500">
          Connect your wallet to start borrowing
        </div>
      )}
    </div>
  );
}
