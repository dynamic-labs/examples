import { safeParseFloat, safeParseUSD } from "../lib/utils";
import type { MarketUserReserveBorrowPosition } from "@aave/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PrimaryWallet {
  address: string;
}

type PrimaryWalletOrNull = PrimaryWallet | null;

interface BorrowCardProps {
  borrow: MarketUserReserveBorrowPosition;
  isOperating: boolean;
  primaryWallet: PrimaryWalletOrNull;
  onRepay: (
    marketAddress: string,
    currencyAddress: string,
    amount: string | "max"
  ) => void;
}

export function BorrowCard({
  borrow,
  isOperating,
  primaryWallet,
  onRepay,
}: BorrowCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{borrow.currency.symbol}</CardTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Market: {borrow.market.name}</p>
          <p>
            Borrowed: {safeParseFloat(borrow.debt.amount, 6)}{" "}
            {borrow.currency.symbol}
          </p>
          <p>USD Value: {safeParseUSD(borrow.debt.usd)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            className="flex-1 text-xs px-3 py-2 border border-input rounded-md text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            defaultValue="1.0"
            step="0.1"
            min="0"
            id={`repay-amount-${borrow.market.address}-${borrow.currency.address}`}
          />
          <Button
            onClick={() => {
              const input = document.getElementById(
                `repay-amount-${borrow.market.address}-${borrow.currency.address}`
              ) as HTMLInputElement;
              const amount = input?.value || "1.0";
              onRepay(borrow.market.address, borrow.currency.address, amount);
            }}
            disabled={isOperating || !primaryWallet}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Repay
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              onRepay(borrow.market.address, borrow.currency.address, "max");
            }}
            disabled={isOperating || !primaryWallet}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Repay Max
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
