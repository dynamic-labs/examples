"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import {
  useDynamicContext,
  useTokenBalances,
  TokenBalance,
} from "@/lib/dynamic";

interface TokenBalanceProviderProps {
  children: React.ReactNode;
}

interface TokenBalanceContextValue {
  balances: TokenBalance[] | undefined;
  isLoading: boolean;
  refetch: (force?: boolean) => void;
  getBalanceByAddress: (address: string) => TokenBalance | undefined;
}

const TokenBalanceContext = createContext<TokenBalanceContextValue | undefined>(
  undefined
);

export function TokenBalanceProvider({ children }: TokenBalanceProviderProps) {
  const { sdkHasLoaded, primaryWallet, network } = useDynamicContext();

  const { tokenBalances, isLoading, fetchAccountBalances } = useTokenBalances({
    networkId: Number(network),
    accountAddress: primaryWallet?.address,
  });

  const getBalanceByAddress = useMemo(
    () =>
      (address: string): TokenBalance | undefined => {
        return tokenBalances?.find(
          (t) => t.address.toLowerCase() === address.toLowerCase()
        );
      },
    [tokenBalances]
  );

  return (
    <TokenBalanceContext.Provider
      value={{
        balances: tokenBalances,
        isLoading,
        refetch: fetchAccountBalances,
        getBalanceByAddress,
      }}
    >
      {children}
    </TokenBalanceContext.Provider>
  );
}

export function useTokenBalanceContext(): TokenBalanceContextValue {
  const ctx = useContext(TokenBalanceContext);
  if (!ctx) {
    throw new Error(
      "useTokenBalanceContext must be used within a TokenBalanceProvider"
    );
  }
  return ctx;
}
