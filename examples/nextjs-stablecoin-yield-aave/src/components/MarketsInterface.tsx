"use client";

import {
  chainId as aaveChainId,
  evmAddress,
  useAaveMarkets,
  useUserBorrows,
  useUserSupplies,
} from "@aave/react";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState } from "react";
import { WalletClient } from "viem";
import { useChainId } from "wagmi";
import { mainnet, base, polygon } from "viem/chains";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactionOperations } from "../lib/useTransactionOperations";
import { getChainName } from "../lib/utils";
import { BorrowCard } from "./BorrowCard";
import { MarketCard } from "./MarketCard";
import { SupplyCard } from "./SupplyCard";

export function MarketsInterface() {
  const { primaryWallet } = useDynamicContext();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastTransaction, setLastTransaction] = useState<{
    type: string;
    hash: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (primaryWallet && isEthereumWallet(primaryWallet)) {
      primaryWallet.getWalletClient().then(setWalletClient);
    }
  }, [primaryWallet]);

  // Force refresh when chain changes
  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [chainId]);

  const handleSwitchChain = async (targetChainId: number) => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      setChainError("Wallet not connected");
      return;
    }

    setIsSwitching(true);
    setChainError(null);

    try {
      if (primaryWallet.connector.supportsNetworkSwitching()) {
        await primaryWallet.switchNetwork(targetChainId);
      } else {
        setChainError("Your wallet doesn't support network switching");
      }
    } catch (err: unknown) {
      setChainError("Failed to switch chain. Please try again.");
    } finally {
      setIsSwitching(false);
    }
  };

  useEffect(() => {
    if (lastTransaction) {
      const timer = setTimeout(() => {
        setLastTransaction(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [lastTransaction]);

  const {
    isOperating,
    executeSupply,
    executeBorrow,
    executeRepay,
    executeWithdraw,
  } = useTransactionOperations(walletClient, chainId);

  const {
    data: markets,
    loading: marketsLoading,
    error: marketsError,
  } = useAaveMarkets({
    chainIds: [aaveChainId(chainId)],
    user: primaryWallet?.address
      ? evmAddress(primaryWallet.address)
      : undefined,
  });

  // Force refetch markets when chain changes
  useEffect(() => {
    if (chainId) {
      // Add a small delay to ensure chain switch is complete
      const timeoutId = setTimeout(() => {
        // Invalidate all queries to force fresh data
        queryClient.invalidateQueries();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [chainId, queryClient]);

  const {
    data: userSupplies,
    loading: userSuppliesLoading,
    error: userSuppliesError,
  } = useUserSupplies({
    markets:
      markets?.map((market) => ({
        chainId: market.chain.chainId,
        address: market.address,
      })) || [],
    user: primaryWallet?.address
      ? evmAddress(primaryWallet.address)
      : undefined,
  });

  const {
    data: userBorrows,
    loading: userBorrowsLoading,
    error: userBorrowsError,
  } = useUserBorrows({
    markets:
      markets?.map((market) => ({
        chainId: market.chain.chainId,
        address: market.address,
      })) || [],
    user: primaryWallet?.address
      ? evmAddress(primaryWallet.address)
      : undefined,
  });

  const handleSupply = async (
    marketAddress: string,
    currencyAddress: string,
    amount: string
  ) => {
    // Log market details when supply button is clicked
    const market = markets?.find((m) => m.address === marketAddress);
    if (market && primaryWallet?.address) {
      const marketDetails = {
        market: market.address,
        amount: {
          erc20: {
            currency: evmAddress(currencyAddress),
            value: amount,
          },
        },
        supplier: evmAddress(primaryWallet.address),
        chainId: market.chain.chainId,
      };
    }

    try {
      const hash = await executeSupply(marketAddress, currencyAddress, amount);
      if (hash) {
        setLastTransaction({
          type: "Supply",
          hash,
          timestamp: Date.now(),
        });
      }
    } catch (error) {}
  };

  const handleBorrow = async (
    marketAddress: string,
    currencyAddress: string,
    amount: string
  ) => {
    try {
      const hash = await executeBorrow(marketAddress, currencyAddress, amount);
      if (hash) {
        setLastTransaction({
          type: "Borrow",
          hash,
          timestamp: Date.now(),
        });
      }
    } catch (error) {}
  };

  const handleRepay = async (
    marketAddress: string,
    currencyAddress: string,
    amount: string | "max"
  ) => {
    try {
      const hash = await executeRepay(marketAddress, currencyAddress, amount);
      if (hash) {
        setLastTransaction({
          type: "Repay",
          hash,
          timestamp: Date.now(),
        });
      }
    } catch (error) {}
  };

  const handleWithdraw = async (
    marketAddress: string,
    currencyAddress: string,
    amount: string
  ) => {
    try {
      const hash = await executeWithdraw(
        marketAddress,
        currencyAddress,
        amount
      );
      if (hash) {
        setLastTransaction({
          type: "Withdraw",
          hash,
          timestamp: Date.now(),
        });
      }
    } catch (error) {}
  };

  // Show error state if there's a chain error
  if (chainError) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-24">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{chainError}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state when chain is changing
  if (isSwitching) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-24">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Switching to {getChainName(chainId)}...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div key={`markets-${chainId}-${refreshKey}`} className="space-y-6 mt-6">
      <h1 className="text-3xl font-bold text-center">
        Dynamic Yield Integration
      </h1>
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Available Markets</CardTitle>
        </CardHeader>
        <CardContent>
          {marketsLoading ? (
            <p className="text-muted-foreground">Loading markets...</p>
          ) : marketsError ? (
            <p className="text-destructive">
              Error loading markets: {String(marketsError)}
            </p>
          ) : markets && markets.length > 0 ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
              {markets.map((market) => (
                <MarketCard
                  key={market.address}
                  market={market}
                  isOperating={isOperating}
                  primaryWallet={primaryWallet}
                  onSupply={handleSupply}
                  onBorrow={handleBorrow}
                />
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No markets found for {getChainName(chainId)}.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Try switching to a supported network:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchChain(mainnet.id)}
                    disabled={isSwitching || Number(chainId) === mainnet.id}
                  >
                    {mainnet.name}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchChain(base.id)}
                    disabled={isSwitching || Number(chainId) === base.id}
                  >
                    {base.name}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchChain(polygon.id)}
                    disabled={isSwitching || Number(chainId) === polygon.id}
                  >
                    {polygon.name}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {primaryWallet && (
        <>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Your Supplies</CardTitle>
            </CardHeader>
            <CardContent>
              {userSuppliesLoading ? (
                <p className="text-muted-foreground">Loading supplies...</p>
              ) : userSuppliesError ? (
                <p className="text-destructive">
                  Error loading supplies: {String(userSuppliesError)}
                </p>
              ) : userSupplies && userSupplies.length > 0 ? (
                <div
                  className={`grid grid-cols-1 gap-4 ${
                    userSupplies.length === 1
                      ? ""
                      : userSupplies.length === 2
                      ? "md:grid-cols-2 max-w-2xl mx-auto"
                      : "md:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {userSupplies.map((supply) => (
                    <SupplyCard
                      key={`${supply.market.address}-${supply.currency.address}`}
                      supply={supply}
                      isOperating={isOperating}
                      primaryWallet={primaryWallet}
                      onSupply={handleSupply}
                      onBorrow={handleBorrow}
                      onWithdraw={handleWithdraw}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No supplies found.</p>
              )}
            </CardContent>
          </Card>

          <Card className="max-w-2xl mx-auto mb-6">
            <CardHeader>
              <CardTitle>Your Borrows</CardTitle>
            </CardHeader>
            <CardContent>
              {userBorrowsLoading ? (
                <p className="text-muted-foreground">Loading borrows...</p>
              ) : userBorrowsError ? (
                <p className="text-destructive">
                  Error loading borrows: {String(userBorrowsError)}
                </p>
              ) : userBorrows && userBorrows.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBorrows.map((borrow) => (
                    <BorrowCard
                      key={`${borrow.market.address}-${borrow.currency.address}`}
                      borrow={borrow}
                      isOperating={isOperating}
                      primaryWallet={primaryWallet}
                      onRepay={handleRepay}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No borrows found.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
