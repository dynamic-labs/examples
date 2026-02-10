"use client";

/**
 * Wallet Balance
 *
 * Fetch the native token balance for a wallet account.
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/wallets/get-balance
 */

import {
  getBalance as sdkGetBalance,
  type WalletAccount,
} from "@dynamic-labs-sdk/client";
import { getClient } from "./client";

/**
 * Get the native token balance for a wallet account.
 * Returns the balance as a string (e.g., "1.5" ETH/SOL) or null if unavailable.
 *
 * @param walletAccount - The wallet account to get the balance for
 * @returns Object containing balance string or null
 *
 * @example
 * ```ts
 * const { balance } = await getBalance({ walletAccount });
 * if (balance) {
 *   console.log(`Balance: ${balance} ${networkData.nativeCurrency.symbol}`);
 * }
 * ```
 */
export async function getBalance(params: {
  walletAccount: WalletAccount;
}): Promise<{ balance: string | null }> {
  const client = getClient();
  if (!client) return { balance: null };

  try {
    return await sdkGetBalance(params);
  } catch {
    return { balance: null };
  }
}
