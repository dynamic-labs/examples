"use client";

import Link from "next/link";
import { useVaultsList } from "../../lib/hooks";

export default function EarnPage() {
  const { vaults, loading, error } = useVaultsList("whitelisted-desc");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <h1 className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-br from-white to-blue-400 bg-clip-text text-transparent">
        Earn
      </h1>

      <div className="mb-12">
        <p className="text-xl text-center text-gray-400 leading-relaxed">
          Choose a vault to start earning yield on your assets
        </p>
      </div>

      {loading && (
        <div className="mt-8 p-8 bg-gray-700 rounded-xl text-center text-gray-400 text-base">
          Loading vaults...
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-500/10 rounded-lg text-center text-red-500 border border-red-500">
          Error loading vaults: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {vaults.length > 0 ? (
            vaults.map((vault) => (
              <Link
                key={vault.id}
                href={`/earn/${vault.id}`}
                className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 cursor-pointer transition-all duration-300 no-underline block hover:border-blue-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-white font-bold text-lg m-0">
                        {vault.name}
                      </h3>
                      {vault.whitelisted && (
                        <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded self-start">
                          Whitelisted
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs m-0 line-clamp-2">
                      {vault.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-green-500 font-bold text-base">
                      {vault.netApy} Net APY
                    </span>
                    {vault.apy !== vault.netApy && (
                      <span className="text-gray-400 font-medium text-xs">
                        {vault.apy} Base
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                      TVL
                    </span>
                    <span className="text-white text-base font-semibold truncate">
                      {vault.tvl}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                      Share Price
                    </span>
                    <span className="text-white text-base font-semibold truncate">
                      {vault.sharePrice}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                      Total Supply
                    </span>
                    <span className="text-white text-base font-semibold truncate">
                      {vault.totalSupply}
                    </span>
                  </div>
                </div>

                {vault.rewards.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4 p-3 bg-white/5 rounded-lg overflow-hidden">
                    <span className="text-gray-400 text-xs font-semibold mr-1 flex-shrink-0">
                      Rewards:
                    </span>
                    {vault.rewards.map((reward, index) => (
                      <span
                        key={index}
                        className="text-blue-600 text-xs font-medium bg-blue-600/10 px-2 py-1 rounded flex-shrink-0"
                      >
                        {reward.asset} {reward.supplyApr}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end items-center">
                  <span className="text-blue-600 text-sm font-semibold">
                    View Details →
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="mt-8 p-8 bg-gray-700 rounded-xl text-center text-gray-400 text-base">
              No vaults available at the moment.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
