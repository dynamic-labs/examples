"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { AleoWalletAccount } from "@dynamic-labs-sdk/aleo";
import { fetchCreditsRecords } from "@/lib/transfers";

/**
 * The wallet's private `credits.aleo` records. There is no hook for this in the
 * React SDK because record listing is Aleo specific, so the provider call is
 * wrapped in TanStack Query here to get caching and invalidation for free.
 */
export const usePrivateRecords = (
  walletAccount: AleoWalletAccount | null,
): UseQueryResult<unknown[], Error> =>
  useQuery({
    enabled: walletAccount !== null,
    queryFn: () => {
      if (!walletAccount) {
        throw new Error("Aleo wallet is not ready yet");
      }

      return fetchCreditsRecords({ walletAccount });
    },
    queryKey: ["aleo-private-records", walletAccount?.id],
  });
