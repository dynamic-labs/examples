/**
 * Dynamic delegated MPC wallet support for the agent.
 *
 * The user approves delegation in the Dynamic SDK (client-side); Dynamic's
 * webhook delivers (encrypted) credentials to your server. This bare-bones
 * example loads pre-decrypted credentials from the environment and uses
 * Dynamic's MPC signing to sign + broadcast transactions on any EVM chain.
 */

import {
  createDelegatedEvmWalletClient,
  delegatedSignTransaction,
  type DelegatedEvmWalletClient,
} from "@dynamic-labs-wallet/node-evm";
import type { ServerKeyShare } from "@dynamic-labs-wallet/node";
import { createPublicClient, http } from "viem";
import { mainnet, polygon, base, arbitrum, optimism, bsc } from "viem/chains";
import type { Chain, TransactionSerializable } from "viem";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DelegationCredentials {
  walletId: string;
  walletAddress: string;
  walletApiKey: string;
  keyShare: ServerKeyShare;
}

// ─── Chain map ────────────────────────────────────────────────────────────────

const CHAIN_MAP: Record<number, Chain> = {
  1: mainnet,
  137: polygon,
  8453: base,
  42161: arbitrum,
  10: optimism,
  56: bsc,
};

export function getChainById(chainId: number): Chain {
  const chain = CHAIN_MAP[chainId];
  if (!chain) {
    throw new Error(
      `Unsupported chainId ${chainId}. Supported: ${Object.keys(CHAIN_MAP).join(", ")}`
    );
  }
  return chain;
}

// ─── Credential loading ─────────────────────────────────────────────────────

/**
 * Loads pre-decrypted delegation credentials from environment variables:
 *   DELEGATED_WALLET_ID, DELEGATED_WALLET_ADDRESS,
 *   DELEGATED_WALLET_API_KEY, DELEGATED_KEY_SHARE (JSON string)
 */
export function loadDelegationCredentials(): DelegationCredentials | null {
  const walletId = process.env.DELEGATED_WALLET_ID;
  const walletAddress = process.env.DELEGATED_WALLET_ADDRESS;
  const walletApiKey = process.env.DELEGATED_WALLET_API_KEY;
  const keyShareJson = process.env.DELEGATED_KEY_SHARE;

  if (!walletId || !walletAddress || !walletApiKey || !keyShareJson) {
    return null;
  }

  try {
    return {
      walletId,
      walletAddress,
      walletApiKey,
      keyShare: JSON.parse(keyShareJson) as ServerKeyShare,
    };
  } catch {
    console.warn("[wallet] Failed to parse DELEGATED_KEY_SHARE as JSON");
    return null;
  }
}

// ─── Delegated client singleton ─────────────────────────────────────────────

let _delegatedClient: DelegatedEvmWalletClient | null = null;

function getDelegatedEvmClient(): DelegatedEvmWalletClient {
  if (!_delegatedClient) {
    const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID;
    const apiKey = process.env.DYNAMIC_API_KEY;
    if (!environmentId || !apiKey) {
      throw new Error(
        "DYNAMIC_ENVIRONMENT_ID and DYNAMIC_API_KEY are required for delegated signing"
      );
    }
    _delegatedClient = createDelegatedEvmWalletClient({ environmentId, apiKey });
  }
  return _delegatedClient;
}

// ─── Sign + broadcast ───────────────────────────────────────────────────────

/**
 * Signs (via Dynamic MPC) and broadcasts a native-value transfer on the given
 * EVM chain. Returns the transaction hash.
 */
export async function sendTransactionDelegated(
  creds: DelegationCredentials,
  chainId: number,
  to: `0x${string}`,
  value: bigint
): Promise<string> {
  const chain = getChainById(chainId);
  const publicClient = createPublicClient({ chain, transport: http() });
  const address = creds.walletAddress as `0x${string}`;

  const nonce = await publicClient.getTransactionCount({ address });
  const block = await publicClient.getBlock({ blockTag: "latest" });
  const baseFee = block.baseFeePerGas ?? BigInt(30_000_000_000);
  const maxPriorityFeePerGas = BigInt(1_500_000_000);
  const maxFeePerGas = baseFee * 2n + maxPriorityFeePerGas;

  let gas: bigint;
  try {
    const estimated = await publicClient.estimateGas({ account: address, to, value });
    gas = (estimated * 12n) / 10n; // 20% buffer
  } catch {
    gas = BigInt(21_000);
  }

  const transaction: TransactionSerializable = {
    type: "eip1559",
    chainId,
    to,
    value,
    nonce,
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };

  const signedTx = await delegatedSignTransaction(getDelegatedEvmClient(), {
    walletId: creds.walletId,
    walletApiKey: creds.walletApiKey,
    keyShare: creds.keyShare,
    transaction,
  });

  return publicClient.sendRawTransaction({
    serializedTransaction: signedTx as `0x${string}`,
  });
}
