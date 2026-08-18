"use client";

import { useQuery } from "@tanstack/react-query";
import { ERC20_ABI, MTOKEN_ABI } from "@/lib/ABIs";
import { MUSDC_ADDRESS, USDC_ADDRESS } from "@/lib/constants";
import { publicClient } from "@/lib/viem";
import { underlyingFromMTokens } from "@/lib/moonwell";

export interface Balances {
  /** USDC sitting in the wallet, in USDC's smallest unit (6 decimals). */
  walletUsdc: bigint;
  /** mToken balance, 8 decimals. */
  mTokenBalance: bigint;
  /** What the mToken balance currently redeems for, in USDC units. */
  suppliedUsdc: bigint;
  /** USDC the mToken contract is allowed to pull. */
  allowance: bigint;
}

export const balancesQueryKey = (address?: string) =>
  ["moonwell", "balances", address ?? "anonymous"] as const;

/**
 * Wallet USDC, supplied balance and allowance for the USDC market.
 *
 * The supplied balance is derived rather than read: an mToken balance is
 * constant while its exchange rate grows, so interest only shows up once the
 * two are multiplied.
 */
export function useBalances(address?: string) {
  return useQuery({
    queryKey: balancesQueryKey(address),
    enabled: !!address,
    staleTime: 5_000,
    refetchInterval: 5_000,
    queryFn: async (): Promise<Balances> => {
      const owner = address as `0x${string}`;
      const [walletUsdc, mTokenBalance, exchangeRate, allowance] =
        await Promise.all([
          publicClient.readContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [owner],
          }),
          publicClient.readContract({
            address: MUSDC_ADDRESS,
            abi: MTOKEN_ABI,
            functionName: "balanceOf",
            args: [owner],
          }),
          publicClient.readContract({
            address: MUSDC_ADDRESS,
            abi: MTOKEN_ABI,
            functionName: "exchangeRateStored",
          }),
          publicClient.readContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [owner, MUSDC_ADDRESS],
          }),
        ]);

      return {
        walletUsdc,
        mTokenBalance,
        suppliedUsdc: underlyingFromMTokens(mTokenBalance, exchangeRate),
        allowance,
      };
    },
  });
}
