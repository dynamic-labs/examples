"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { AleoWalletAccount } from "@dynamic-labs-sdk/aleo";
import { sendPrivateCredits } from "@/lib/transfers";

type SendPrivateCreditsVariables = {
  credits: string;
  recipient: string;
};

type SendPrivateCreditsResult = {
  networkId: string;
  transactionId: string;
};

/**
 * Sends credits privately and refreshes the balances afterwards. The mutation
 * stays pending for the whole proving run, which is what the UI shows while the
 * wallet generates the zero-knowledge proof.
 */
export const useSendPrivateCredits = (
  walletAccount: AleoWalletAccount | null,
): UseMutationResult<
  SendPrivateCreditsResult,
  Error,
  SendPrivateCreditsVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ credits, recipient }: SendPrivateCreditsVariables) => {
      if (!walletAccount) {
        throw new Error("Aleo wallet is not ready yet");
      }

      return sendPrivateCredits({ credits, recipient, walletAccount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aleo-private-records"] });
      queryClient.invalidateQueries({ queryKey: ["useGetNativeBalance"] });
    },
  });
};
