"use client";

import { getRoutes, executeRoute, type Route, type ExchangeRateUpdateParams } from "@lifi/sdk";
import { useCallback, useState } from "react";
import { parseUnits, formatUnits } from "viem";

export interface LiFiSwapParams {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  fromTokenDecimals: number;
  toTokenAddress: string;
  fromAmount: string;
  fromAddress: string;
  toAddress: string;
}

export interface UseLiFiReturn {
  routes: Route[];
  isLoading: boolean;
  error: string | null;
  getRoutesForSwap: (params: LiFiSwapParams) => Promise<Route[]>;
  executeSwap: (route: Route) => Promise<void>;
  clearError: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes("rejected") || err.message.includes("denied")) {
      return "Transaction rejected by user.";
    }
    if (err.message.includes("insufficient")) {
      return "Insufficient balance for this transaction.";
    }
    return err.message;
  }
  return "Swap failed. Please try again.";
}

export function useLiFi(): UseLiFiReturn {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoutesForSwap = useCallback(
    async (params: LiFiSwapParams): Promise<Route[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const amountInUnits = parseUnits(params.fromAmount, params.fromTokenDecimals);

        const result = await getRoutes({
          fromChainId: params.fromChainId,
          toChainId: params.toChainId,
          fromTokenAddress: params.fromTokenAddress,
          toTokenAddress: params.toTokenAddress,
          fromAmount: amountInUnits.toString(),
          fromAddress: params.fromAddress,
          toAddress: params.toAddress,
          options: {
            order: "RECOMMENDED",
            slippage: 0.03,
          },
        });

        const availableRoutes = result.routes || [];
        setRoutes(availableRoutes);

        if (availableRoutes.length === 0) {
          setError("No routes available for this swap");
        }

        return availableRoutes;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const executeSwap = useCallback(async (route: Route) => {
    setIsLoading(true);
    setError(null);

    try {
      await executeRoute(route, {
        updateRouteHook: () => {},
        acceptExchangeRateUpdateHook: async ({
          oldToAmount,
          newToAmount,
          toToken,
        }: ExchangeRateUpdateParams) => {
          const oldAmt = parseFloat(
            formatUnits(BigInt(oldToAmount), toToken.decimals)
          );
          const newAmt = parseFloat(
            formatUnits(BigInt(newToAmount), toToken.decimals)
          );
          const change = ((newAmt - oldAmt) / oldAmt) * 100;
          if (Math.abs(change) <= 5) return true;
          return window.confirm(
            `Rate changed by ${change.toFixed(2)}%. Continue?`
          );
        },
      });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    routes,
    isLoading,
    error,
    getRoutesForSwap,
    executeSwap,
    clearError,
  };
}
