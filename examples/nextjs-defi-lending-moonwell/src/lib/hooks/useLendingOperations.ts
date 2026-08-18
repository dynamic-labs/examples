"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Account } from "viem";
import {
  getActiveNetworkId,
  isProgrammaticNetworkSwitchAvailable,
  switchActiveNetwork,
} from "@dynamic-labs-sdk/client";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";
import type { EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { ERC20_ABI, MTOKEN_ABI } from "@/lib/ABIs";
import { CHAIN_ID, MUSDC_ADDRESS, USDC_ADDRESS } from "@/lib/constants";
import { balancesQueryKey } from "@/lib/hooks/useBalances";
import { publicClient } from "@/lib/viem";
import { formatErrorMessage, isStaleAllowanceError } from "@/lib/utils";

export type TxPhase =
  | "idle"
  | "switching"
  | "approving"
  | "pending"
  | "success"
  | "error";

export interface TxState {
  phase: TxPhase;
  hash?: `0x${string}`;
  error?: string;
  /** Which operation the state refers to, e.g. "approval" or "supply". */
  action?: string;
}

const IDLE: TxState = { phase: "idle" };

/**
 * Compound v2 markets answer some failures with a non-zero return code instead
 * of reverting, so a transaction can succeed on-chain while doing nothing.
 * Simulating first exposes that code — anything but 0 is a refusal.
 */
export function assertNoErrorCode(result: unknown, action: string) {
  if (typeof result === "bigint" && result !== 0n) {
    throw new Error(
      `Moonwell rejected the ${action} with error code ${result}. ` +
        `See https://docs.moonwell.fi for what each code means.`,
    );
  }
}

/**
 * Blocks until the RPC is serving at least `blockNumber`.
 *
 * Invalidating the balance queries the instant a receipt arrives usually reads
 * back the *old* balances: the receipt came from one node, and the refetch can
 * be served by another that has not applied that block. React Query then caches
 * those stale values, so the UI sits on pre-transaction numbers until a later
 * poll happens to hit a caught-up node.
 */
async function waitForBlock(
  blockNumber: bigint,
  attempts = 10,
  delayMs = 400,
) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    // cacheTime 0, or viem answers from its own short-lived block cache.
    const current = await publicClient.getBlockNumber({ cacheTime: 0 });
    if (current >= blockNumber) return;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  // Giving up is survivable — the 5s balance poll catches up on its own —
  // but it should never be silent.
  console.warn(`RPC still behind block ${blockNumber}; balances may lag.`);
}

export function useLendingOperations(evmAccount: EvmWalletAccount | null) {
  const queryClient = useQueryClient();
  const [tx, setTx] = useState<TxState>(IDLE);

  const address = evmAccount?.address as `0x${string}` | undefined;

  /**
   * Puts the wallet on Base before anything is signed.
   *
   * An embedded wallet does not start on Base just because Base is enabled — it
   * opens on whatever network the environment considers default. And
   * `createWalletClientForWalletAccount` derives its chain from the wallet's
   * *current* network, so the switch has to happen before the client is built,
   * not after.
   *
   * Embedded wallets switch programmatically with no user prompt. An external
   * wallet may refuse, so the capability is checked rather than assumed.
   */
  const getWalletClient = useCallback(
    async (onSwitchStart?: () => void) => {
      if (!evmAccount) throw new Error("Connect a wallet first");

      const { networkId } = await getActiveNetworkId({
        walletAccount: evmAccount,
      });

      if (Number(networkId) !== CHAIN_ID) {
        if (!isProgrammaticNetworkSwitchAvailable({ walletAccount: evmAccount })) {
          throw new Error(
            `This wallet is on chain ${networkId} and cannot switch networks programmatically. Switch to Base (${CHAIN_ID}) in your wallet, then try again.`,
          );
        }
        onSwitchStart?.();
        await switchActiveNetwork({
          networkId: String(CHAIN_ID),
          walletAccount: evmAccount,
        });
      }

      const walletClient = await createWalletClientForWalletAccount({
        walletAccount: evmAccount,
      });

      // Backstop: if the switch silently failed we would otherwise sign against
      // the wrong chain's contracts.
      if (walletClient.chain?.id !== CHAIN_ID) {
        throw new Error(
          `Wallet is still on chain ${walletClient.chain?.id ?? "unknown"} after switching to Base (${CHAIN_ID}).`,
        );
      }

      // The embedded wallet signs locally, which viem models as a `local`
      // account. A `json-rpc` account means the SDK fell back to proxying
      // through a provider that cannot sign — the transaction would be
      // forwarded to a public RPC, which holds no keys and answers
      // `eth_sendTransaction` with "rpc method is unsupported". Failing here
      // names the cause instead of surfacing that as a network error.
      if (walletClient.account?.type !== "local") {
        throw new Error(
          `Selected wallet cannot sign locally (viem account type "${walletClient.account?.type ?? "unknown"}"). This example expects a Dynamic embedded wallet.`,
        );
      }
      return walletClient;
    },
    [evmAccount],
  );

  const reset = useCallback(() => setTx(IDLE), []);

  /**
   * Runs one simulate → write → wait cycle and keeps `tx` in step with it.
   * `phase` is the caller's label for the in-flight state so the UI can tell
   * an approval apart from the supply that follows it.
   *
   * The simulate callback is handed the wallet's *account object*, not its
   * address. `writeContract` prefers the account carried on the simulated
   * request over the one on the client, and an address string parses into a
   * `json-rpc` account — which would send `eth_sendTransaction` to the RPC
   * instead of signing locally with the embedded wallet.
   */
  const run = useCallback(
    async (
      phase: Exclude<TxPhase, "idle" | "switching" | "success" | "error">,
      action: string,
      simulate: (account: Account) => Promise<{
        request: Parameters<
          Awaited<ReturnType<typeof getWalletClient>>["writeContract"]
        >[0];
        result: unknown;
      }>,
      /**
       * How many times to retry the simulate step while it fails on a stale
       * allowance. Simulation is a read, so retrying it is free and safe — the
       * write still happens exactly once, after a simulate that succeeded.
       */
      simulateAttempts = 1,
    ) => {
      if (!address) {
        setTx({ phase: "error", error: "Connect a wallet first" });
        return false;
      }
      setTx({ phase });
      let hash: `0x${string}` | undefined;
      try {
        // Only surfaces the switching phase when a switch is actually needed, so
        // the common same-chain path does not flash it.
        const walletClient = await getWalletClient(() =>
          setTx({ phase: "switching" }),
        );
        setTx({ phase });

        let simulated: Awaited<ReturnType<typeof simulate>> | undefined;
        for (let attempt = 1; ; attempt++) {
          try {
            simulated = await simulate(walletClient.account);
            break;
          } catch (error) {
            if (attempt >= simulateAttempts || !isStaleAllowanceError(error)) {
              throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 1_000));
          }
        }

        const { request, result } = simulated;
        assertNoErrorCode(result, action);

        hash = await walletClient.writeContract(request);
        setTx({ phase, hash, action });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
          throw new Error(`${action} transaction reverted`);
        }

        // The transaction is final the moment the receipt says success, so
        // report it now. The refresh below makes ten more RPC round-trips, and
        // a hiccup in any of them must not repaint a mined transaction as a
        // failure.
        setTx({ phase: "success", hash, action });

        try {
          // Only refetch once the RPC can actually see this block, otherwise
          // the refreshed balances are the pre-transaction ones.
          await waitForBlock(receipt.blockNumber);
          await queryClient.invalidateQueries({
            queryKey: balancesQueryKey(address),
          });
        } catch (refreshError) {
          // Best-effort: the 5s balance poll catches up on its own.
          console.error(`Balance refresh after the ${action} failed`, refreshError);
        }
        return true;
      } catch (error) {
        console.error(`The ${action} failed`, error);
        // Keep the hash when the write was broadcast: whether the funds moved
        // is the one thing the user most needs to check, so the UI links it.
        setTx({ phase: "error", error: formatErrorMessage(error), action, hash });
        return false;
      }
    },
    [address, getWalletClient, queryClient],
  );

  /** Approves the mToken to spend `amount` USDC. */
  const approve = useCallback(
    (amount: bigint) =>
      run("approving", "approval", async (account) =>
        publicClient.simulateContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [MUSDC_ADDRESS, amount],
          account,
        }),
      ),
    [run],
  );

  /**
   * Supplies USDC and receives mUSDC.
   *
   * `simulateAttempts` above 1 is for a supply chained straight onto an
   * approval: the allowance is on-chain but the read path may not serve it for
   * a few seconds, and retrying the simulate absorbs that without asking the
   * user to press anything twice.
   */
  const supply = useCallback(
    (amount: bigint, simulateAttempts = 1) =>
      run(
        "pending",
        "supply",
        async (account) =>
          publicClient.simulateContract({
            address: MUSDC_ADDRESS,
            abi: MTOKEN_ABI,
            functionName: "mint",
            args: [amount],
            account,
          }),
        simulateAttempts,
      ),
    [run],
  );

  /** Withdraws an exact USDC amount. */
  const withdraw = useCallback(
    (amount: bigint) =>
      run("pending", "withdrawal", async (account) =>
        publicClient.simulateContract({
          address: MUSDC_ADDRESS,
          abi: MTOKEN_ABI,
          functionName: "redeemUnderlying",
          args: [amount],
          account,
        }),
      ),
    [run],
  );

  /**
   * Withdraws everything by redeeming the whole mToken balance. Going through
   * `redeem` rather than `redeemUnderlying` avoids leaving dust behind when the
   * exchange rate moves between quoting and mining.
   */
  const withdrawMax = useCallback(
    (mTokenBalance: bigint) =>
      run("pending", "withdrawal", async (account) =>
        publicClient.simulateContract({
          address: MUSDC_ADDRESS,
          abi: MTOKEN_ABI,
          functionName: "redeem",
          args: [mTokenBalance],
          account,
        }),
      ),
    [run],
  );

  return { tx, reset, approve, supply, withdraw, withdrawMax };
}
