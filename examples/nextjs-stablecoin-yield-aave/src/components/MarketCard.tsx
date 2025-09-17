import { useState } from "react";
import { safeParseUSD, safeParseHealthFactor } from "../lib/utils";
import type { Market } from "@aave/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PrimaryWallet {
  address: string;
}

type PrimaryWalletOrNull = PrimaryWallet | null;

interface MarketCardProps {
  market: Market;
  isOperating: boolean;
  primaryWallet: PrimaryWalletOrNull;
  onSupply: (
    marketAddress: string,
    currencyAddress: string,
    amount: string
  ) => void;
  onBorrow: (
    marketAddress: string,
    currencyAddress: string,
    amount: string
  ) => void;
}

export function MarketCard({
  market,
  isOperating,
  primaryWallet,
  onSupply,
  onBorrow,
}: MarketCardProps) {
  // State for selected tokens
  const [selectedSupplyToken, setSelectedSupplyToken] = useState<string>(
    market.supplyReserves[0]?.underlyingToken.address || ""
  );
  const [selectedBorrowToken, setSelectedBorrowToken] = useState<string>(
    market.borrowReserves[0]?.underlyingToken.address || ""
  );

  // Get selected token details
  const selectedSupplyReserve = market.supplyReserves.find(
    (reserve) => reserve.underlyingToken.address === selectedSupplyToken
  );
  const selectedBorrowReserve = market.borrowReserves.find(
    (reserve) => reserve.underlyingToken.address === selectedBorrowToken
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{market.name}</CardTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Chain: {market.chain.name}</p>
          <p>Total Market Size: {safeParseUSD(market.totalMarketSize)}</p>
          <p>
            Available Liquidity: {safeParseUSD(market.totalAvailableLiquidity)}
          </p>
          <p>
            Reserves: {market.supplyReserves.length} supply,{" "}
            {market.borrowReserves.length} borrow
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {market.userState && (
          <div className="p-3 border rounded-lg bg-muted/50">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Net Worth: {safeParseUSD(market.userState.netWorth)}
            </p>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Health Factor:{" "}
              {safeParseHealthFactor(market.userState.healthFactor)}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Quick Actions</h4>

          {/* Supply Section */}
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground">
              Supply
            </h5>
            <div className="space-y-2">
              {/* Token Selector */}
              <div className="relative">
                <select
                  value={selectedSupplyToken}
                  onChange={(e) => setSelectedSupplyToken(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-input rounded-md text-foreground bg-background appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isOperating}
                >
                  {market.supplyReserves.map((reserve) => (
                    <option
                      key={reserve.underlyingToken.address}
                      value={reserve.underlyingToken.address}
                    >
                      {reserve.underlyingToken.symbol} -{" "}
                      {reserve.underlyingToken.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg
                    className="w-3 h-3 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Token Info */}
              {selectedSupplyReserve && (
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedSupplyReserve.underlyingToken.imageUrl && (
                      <Image
                        src={selectedSupplyReserve.underlyingToken.imageUrl}
                        alt={selectedSupplyReserve.underlyingToken.symbol}
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                    )}
                    <span className="font-medium text-foreground">
                      {selectedSupplyReserve.underlyingToken.symbol}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      APY: {selectedSupplyReserve.supplyInfo.apy.formatted}%
                    </div>
                    <div>
                      Max LTV:{" "}
                      {selectedSupplyReserve.supplyInfo.maxLTV.formatted}%
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input and Button */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  className="flex-1 text-xs px-3 py-2 border border-input rounded-md text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  defaultValue="1.0"
                  step="0.1"
                  min="0"
                  id={`supply-amount-${market.address}`}
                />
                <Button
                  onClick={() => {
                    if (selectedSupplyReserve) {
                      const input = document.getElementById(
                        `supply-amount-${market.address}`
                      ) as HTMLInputElement;
                      const amount = input?.value || "1.0";
                      onSupply(
                        market.address,
                        selectedSupplyReserve.underlyingToken.address,
                        amount
                      );
                    }
                  }}
                  disabled={
                    isOperating || !primaryWallet || !selectedSupplyReserve
                  }
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Supply
                </Button>
              </div>
            </div>
          </div>

          {/* Borrow Section */}
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground">
              Borrow
            </h5>
            <div className="space-y-2">
              {/* Token Selector */}
              <div className="relative">
                <select
                  value={selectedBorrowToken}
                  onChange={(e) => setSelectedBorrowToken(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-input rounded-md text-foreground bg-background appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isOperating}
                >
                  {market.borrowReserves.map((reserve) => (
                    <option
                      key={reserve.underlyingToken.address}
                      value={reserve.underlyingToken.address}
                    >
                      {reserve.underlyingToken.symbol} -{" "}
                      {reserve.underlyingToken.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg
                    className="w-3 h-3 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Token Info */}
              {selectedBorrowReserve && selectedBorrowReserve.borrowInfo && (
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedBorrowReserve.underlyingToken.imageUrl && (
                      <Image
                        src={selectedBorrowReserve.underlyingToken.imageUrl}
                        alt={selectedBorrowReserve.underlyingToken.symbol}
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                    )}
                    <span className="font-medium text-foreground">
                      {selectedBorrowReserve.underlyingToken.symbol}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      APR: {selectedBorrowReserve.borrowInfo.apy.formatted}%
                    </div>
                    <div>
                      Available:{" "}
                      {safeParseUSD(
                        selectedBorrowReserve.borrowInfo.availableLiquidity.usd
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input and Button */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  className="flex-1 text-xs px-3 py-2 border border-input rounded-md text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  defaultValue="1.0"
                  step="0.1"
                  min="0"
                  id={`borrow-amount-${market.address}`}
                />
                <Button
                  onClick={() => {
                    if (selectedBorrowReserve) {
                      const input = document.getElementById(
                        `borrow-amount-${market.address}`
                      ) as HTMLInputElement;
                      const amount = input?.value || "1.0";
                      onBorrow(
                        market.address,
                        selectedBorrowReserve.underlyingToken.address,
                        amount
                      );
                    }
                  }}
                  disabled={
                    isOperating || !primaryWallet || !selectedBorrowReserve
                  }
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Borrow
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
