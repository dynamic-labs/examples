/**
 * Bridges a Dynamic delegated MPC wallet into an x402 v2 client signer.
 *
 * x402's EVM "exact" scheme is a gasless USDC payment: the payer signs an
 * EIP-3009 `transferWithAuthorization` as EIP-712 typed data, and the facilitator
 * submits it on-chain. x402 v2's `ExactEvmScheme` only needs a signer with an
 * `address` and `signTypedData(...)` for this base flow.
 *
 * So we expose exactly those two: `signTypedData` forwards the typed-data struct
 * to Dynamic's `delegatedSignTypedData` — the private key share never leaves
 * Dynamic's MPC. No gas, no transaction, no raw key.
 *
 * Framework-agnostic (process.env only) so the standalone agent can use it.
 */
import {
  createDelegatedEvmWalletClient,
  delegatedSignTypedData,
} from "@dynamic-labs-wallet/node-evm";
import type { ServerKeyShare } from "@dynamic-labs-wallet/node";
import type { DelegationRecord } from "./delegation-store";

/** The minimal signer x402 v2's ExactEvmScheme needs for the EIP-3009 flow. */
export interface X402EvmSigner {
  readonly address: `0x${string}`;
  signTypedData(message: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<`0x${string}`>;
}

/**
 * Build an x402 v2 EVM signer backed by a Dynamic delegated wallet.
 * Only `signTypedData` is supported — that's all x402's exact scheme needs.
 */
export function createDynamicX402Account(
  delegation: DelegationRecord
): X402EvmSigner {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID;
  const apiKey = process.env.DYNAMIC_API_TOKEN;
  if (!environmentId || !apiKey) {
    throw new Error(
      "NEXT_PUBLIC_DYNAMIC_ENV_ID and DYNAMIC_API_TOKEN are required for delegated signing"
    );
  }

  const client = createDelegatedEvmWalletClient({ environmentId, apiKey });

  return {
    address: delegation.address as `0x${string}`,
    async signTypedData(typedData) {
      const signature = await delegatedSignTypedData(client, {
        walletId: delegation.walletId,
        walletApiKey: delegation.walletApiKey,
        keyShare: delegation.delegatedShare as ServerKeyShare,
        // typedData = { domain, types, primaryType, message }
        typedData: typedData as never,
      });
      return signature as `0x${string}`;
    },
  };
}
