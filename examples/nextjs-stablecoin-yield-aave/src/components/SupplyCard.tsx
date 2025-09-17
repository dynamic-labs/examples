import { safeParseFloat, safeParseUSD } from "../lib/utils";
import type { MarketUserReserveSupplyPosition } from "@aave/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PrimaryWallet {
  address: string;
}

type PrimaryWalletOrNull = PrimaryWallet | null;

interface SupplyCardProps {
  supply: MarketUserReserveSupplyPosition;
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
  onWithdraw: (
    marketAddress: string,
    currencyAddress: string,
    amount: string
  ) => void;
}

export function SupplyCard({
  supply,
  isOperating,
  primaryWallet,
  onSupply,
  onBorrow,
  onWithdraw,
}: SupplyCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{supply.currency.symbol}</CardTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Market: {supply.market.name}</p>
          <p>
            Balance: {safeParseFloat(supply.balance.amount, 6)}{" "}
            {supply.currency.symbol}
          </p>
          <p>USD Value: {safeParseUSD(supply.balance.usd)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Supply more */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            className="flex-1 text-xs px-3 py-2 border border-input rounded-md text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            defaultValue="1.0"
            step="0.1"
            min="0"
            id={`supply-more-amount-${supply.market.address}-${supply.currency.address}`}
          />
          <Button
            onClick={() => {
              const input = document.getElementById(
                `supply-more-amount-${supply.market.address}-${supply.currency.address}`
              ) as HTMLInputElement;
              const amount = input?.value || "1.0";
              onSupply(supply.market.address, supply.currency.address, amount);
            }}
            disabled={isOperating || !primaryWallet}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Supply More
          </Button>
        </div>

        {/* Borrow */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            className="flex-1 text-xs px-3 py-2 border border-input rounded-md text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            defaultValue="1.0"
            step="0.1"
            min="0"
            id={`borrow-amount-${supply.market.address}-${supply.currency.address}`}
          />
          <Button
            onClick={() => {
              const input = document.getElementById(
                `borrow-amount-${supply.market.address}-${supply.currency.address}`
              ) as HTMLInputElement;
              const amount = input?.value || "1.0";
              onBorrow(supply.market.address, supply.currency.address, amount);
            }}
            disabled={isOperating || !primaryWallet}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Borrow
          </Button>
        </div>

        {/* Withdraw */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            className="flex-1 text-xs px-3 py-2 border border-input rounded-md text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            defaultValue="1.0"
            step="0.1"
            min="0"
            id={`withdraw-amount-${supply.market.address}-${supply.currency.address}`}
          />
          <Button
            onClick={() => {
              const input = document.getElementById(
                `withdraw-amount-${supply.market.address}-${supply.currency.address}`
              ) as HTMLInputElement;
              const amount = input?.value || "1.0";
              onWithdraw(
                supply.market.address,
                supply.currency.address,
                amount
              );
            }}
            disabled={isOperating || !primaryWallet}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Withdraw
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
