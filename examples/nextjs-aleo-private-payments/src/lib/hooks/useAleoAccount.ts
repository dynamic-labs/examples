"use client";

import { useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import type { WalletAccount } from "@dynamic-labs-sdk/client";
import { isAleoWalletAccount, type AleoWalletAccount } from "@dynamic-labs-sdk/aleo";

/**
 * The user's Aleo account, or null while the embedded wallet is still being
 * created. `useGetWalletAccounts` is typed as the chain-agnostic base account,
 * while the type guard is declared over the chain-specific account union.
 */
export const useAleoAccount = (): AleoWalletAccount | null => {
  const { data: accounts = [] } = useGetWalletAccounts();

  return (accounts as WalletAccount[]).find(isAleoWalletAccount) ?? null;
};
