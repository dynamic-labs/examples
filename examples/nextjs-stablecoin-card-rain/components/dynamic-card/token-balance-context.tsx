"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, type Address } from "viem";
import { baseSepolia } from "viem/chains";
import { useUser, useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface TokenBalance {
  address: string;
  balance: number;
  symbol?: string;
}

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

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export function TokenBalanceProvider({ children }: TokenBalanceProviderProps) {
  const user = useUser();
  const accounts = useWalletAccounts();
  const primaryWallet = accounts.find(isEvmWalletAccount) ?? null;

  const [balances, setBalances] = useState<TokenBalance[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [trackedAddresses, setTrackedAddresses] = useState<string[]>([]);

  const fetchBalances = useCallback(
    async (force = false) => {
      if (!primaryWallet?.address || trackedAddresses.length === 0) return;
      setIsLoading(true);
      try {
        const results = await Promise.all(
          trackedAddresses.map(async (tokenAddress) => {
            try {
              const [rawBalance, decimals] = await Promise.all([
                publicClient.readContract({
                  address: tokenAddress as Address,
                  abi: ERC20_BALANCE_ABI,
                  functionName: "balanceOf",
                  args: [primaryWallet.address as Address],
                }),
                publicClient.readContract({
                  address: tokenAddress as Address,
                  abi: ERC20_BALANCE_ABI,
                  functionName: "decimals",
                }),
              ]);
              const balance = Number(rawBalance) / 10 ** Number(decimals);
              return { address: tokenAddress, balance } as TokenBalance;
            } catch {
              return { address: tokenAddress, balance: 0 } as TokenBalance;
            }
          })
        );
        setBalances(results);
      } catch {
        // no-op
      } finally {
        setIsLoading(false);
      }
    },
    [primaryWallet?.address, trackedAddresses]
  );

  useEffect(() => {
    if (primaryWallet?.address && trackedAddresses.length > 0) {
      fetchBalances();
    }
  }, [primaryWallet?.address, trackedAddresses, fetchBalances]);

  const getBalanceByAddress = useCallback(
    (address: string): TokenBalance | undefined => {
      if (!balances) return undefined;
      const found = balances.find(
        (t) => t.address.toLowerCase() === address.toLowerCase()
      );
      if (!found && address) {
        // Register this address for tracking
        setTrackedAddresses((prev) =>
          prev.includes(address.toLowerCase()) ? prev : [...prev, address.toLowerCase()]
        );
      }
      return found;
    },
    [balances]
  );

  return (
    <TokenBalanceContext.Provider
      value={{
        balances,
        isLoading,
        refetch: fetchBalances,
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
