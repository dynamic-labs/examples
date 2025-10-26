"use client";

import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState, useCallback } from "react";
import { WalletClient } from "viem";
import { useChainId } from "wagmi";
import { mainnet, base, polygon } from "viem/chains";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactionOperations } from "../lib/useTransactionOperations";
import { getChainName } from "../lib/utils";
import {
  client as podsClient,
  Strategy,
  WalletPositions,
  Position,
} from "../lib/pods";

export function YieldInterface() {
  const { primaryWallet } = useDynamicContext();
  const chainId = useChainId();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastTransaction, setLastTransaction] = useState<{
    type: string;
    hash: string;
    timestamp: number;
  } | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<WalletPositions | null>(null);

  console.log("strategies", strategies);

  useEffect(() => {
    if (primaryWallet && isEthereumWallet(primaryWallet)) {
      primaryWallet.getWalletClient().then(setWalletClient);
    }
  }, [primaryWallet]);

  const fetchStrategies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch up to 100 strategies at once
      const response = await podsClient.getStrategies(chainId, 100);
      console.log("response", response);
      const activeStrategies = response.data.filter(
        (s) => s.isActive !== false
      );
      console.log("activeStrategies", activeStrategies);
      setStrategies(activeStrategies);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  // Fetch positions when wallet is connected
  useEffect(() => {
    const fetchPositions = async () => {
      if (!primaryWallet?.address) {
        setPositions(null);
        return;
      }

      try {
        const data = await podsClient.getWalletPositions(primaryWallet.address);
        setPositions(data);
      } catch (err) {
        console.error("Failed to fetch positions:", err);
        setPositions(null);
      }
    };

    fetchPositions();
  }, [primaryWallet?.address]);

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
    } catch {
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

  const { isOperating, executeDeposit, executeWithdraw } =
    useTransactionOperations(walletClient, chainId);

  const handleDeposit = async (strategy: Strategy, amount: string) => {
    try {
      const hash = await executeDeposit(strategy, amount);
      if (hash) {
        setLastTransaction({
          type: "Deposit",
          hash,
          timestamp: Date.now(),
        });
        // Refresh strategies after successful deposit
        fetchStrategies();
      }
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  const handleWithdraw = async (strategy: Strategy, amount: string) => {
    try {
      const hash = await executeWithdraw(strategy, amount);
      if (hash) {
        setLastTransaction({
          type: "Withdraw",
          hash,
          timestamp: Date.now(),
        });
        // Refresh strategies and positions after successful withdraw
        fetchStrategies();
        if (primaryWallet?.address) {
          const data = await podsClient.getWalletPositions(
            primaryWallet.address
          );
          setPositions(data);
        }
      }
    } catch (error) {
      console.error("Withdraw failed:", error);
    }
  };

  const handlePositionWithdraw = async (position: Position, amount: string) => {
    // Create a strategy-like object from the position for the withdraw operation
    const strategy: Strategy = {
      asset: position.asset.address,
      protocol: position.protocol,
      assetName: position.asset.symbol,
      network: "", // We don't have this info from positions
      networkId: position.asset.decimals, // Reusing decimals field temporarily
      implementationSelector: position.protocol,
      startDate: "",
      underlyingAsset: position.asset.address,
      assetDecimals: parseInt(position.asset.decimals),
      underlyingDecimals: parseInt(position.asset.decimals),
      id: `${position.protocol}-${position.asset.symbol}-unknown`,
      fee: "0",
    };

    await handleWithdraw(strategy, amount);
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
    <div key={`yield-${chainId}-${refreshKey}`} className="space-y-6 mt-6">
      <h1 className="text-3xl font-bold text-center">
        Yield Strategies with Dynamic
      </h1>

      {lastTransaction && (
        <Card className="max-w-5xl mx-auto bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <p className="text-center text-green-600 dark:text-green-400">
              ✅ {lastTransaction.type} transaction sent! Hash:{" "}
              {lastTransaction.hash.slice(0, 10)}...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Open Positions Section */}
      {positions && positions.positions.length > 0 && (
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle>Your Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positions.positions.map((position, idx) => (
                <PositionCard
                  key={idx}
                  position={position}
                  isOperating={isOperating}
                  onWithdraw={handlePositionWithdraw}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Strategies Section */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Available Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading strategies...</p>
          ) : error ? (
            <p className="text-destructive">
              Error loading strategies: {error}
            </p>
          ) : strategies && strategies.length > 0 ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
              {strategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  isOperating={isOperating}
                  primaryWallet={primaryWallet}
                  onDeposit={handleDeposit}
                  onWithdraw={handleWithdraw}
                />
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No strategies found for {getChainName(chainId)}.
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
    </div>
  );
}

// Position Card Component
interface PositionCardProps {
  position: Position;
  isOperating: boolean;
  onWithdraw: (position: Position, amount: string) => void;
}

function PositionCard({
  position,
  isOperating,
  onWithdraw,
}: PositionCardProps) {
  const [amount, setAmount] = useState("");

  const handleAction = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    onWithdraw(position, amount);
    setAmount("");
  };

  const apyPercent = (parseFloat(position.apy) * 100).toFixed(2);

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{position.asset.symbol}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {position.protocol}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="font-semibold">
              {position.balance.humanized.toFixed(4)} {position.asset.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">USD Value</span>
            <span className="font-semibold">${position.balanceUSD}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current APY</span>
            <span className="text-lg font-bold text-blue-600">
              {apyPercent}%
            </span>
          </div>
        </div>

        {position.rewards && position.rewards.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">
              Rewards:
            </p>
            {position.rewards.map((reward, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>
                  {reward.amount} {reward.token.symbol}
                </span>
                <span className="text-muted-foreground">
                  ${reward.amountUSD}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 pt-2 border-t">
          <input
            type="number"
            placeholder="Amount to withdraw"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isOperating}
            max={position.balance.humanized}
          />
          <Button
            onClick={handleAction}
            variant="outline"
            disabled={
              isOperating ||
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > position.balance.humanized
            }
            className="w-full"
          >
            Withdraw
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Strategy Card Component
interface StrategyCardProps {
  strategy: Strategy;
  isOperating: boolean;
  primaryWallet: { address: string } | null;
  onDeposit: (strategy: Strategy, amount: string) => void;
  onWithdraw: (strategy: Strategy, amount: string) => void;
}

function StrategyCard({
  strategy,
  isOperating,
  primaryWallet,
  onDeposit,
  onWithdraw,
}: StrategyCardProps) {
  const [amount, setAmount] = useState("");
  const [isDeposit, setIsDeposit] = useState(true);

  const apy = strategy.spotPosition?.apy ?? 0;
  const apyPercent = (apy * 100).toFixed(2);

  const handleAction = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    if (isDeposit) {
      onDeposit(strategy, amount);
    } else {
      onWithdraw(strategy, amount);
    }

    setAmount("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{strategy.assetName}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {strategy.protocol}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">APY</span>
          <span className="text-2xl font-bold text-green-600">
            {apyPercent}%
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isDeposit ? "default" : "outline"}
            size="sm"
            onClick={() => setIsDeposit(true)}
            disabled={isOperating}
          >
            Deposit
          </Button>
          <Button
            variant={!isDeposit ? "default" : "outline"}
            size="sm"
            onClick={() => setIsDeposit(false)}
            disabled={isOperating}
          >
            Withdraw
          </Button>
        </div>

        <div className="space-y-2">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isOperating || !primaryWallet}
          />
          <Button
            onClick={handleAction}
            disabled={
              isOperating ||
              !primaryWallet ||
              !amount ||
              parseFloat(amount) <= 0
            }
            className="w-full"
          >
            {isDeposit ? "Deposit" : "Withdraw"}
          </Button>
        </div>

        {!primaryWallet && (
          <p className="text-xs text-muted-foreground text-center">
            Connect wallet to interact
          </p>
        )}
      </CardContent>
    </Card>
  );
}
