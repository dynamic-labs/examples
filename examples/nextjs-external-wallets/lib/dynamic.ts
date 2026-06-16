import {
  createDynamicClient,
  initializeClient,
  type DynamicClient,
} from "@dynamic-labs-sdk/client";
import { addWaasEvmExtension } from "@dynamic-labs-sdk/evm/waas";
import { addWaasSolanaExtension } from "@dynamic-labs-sdk/solana/waas";

export const dynamicClient: DynamicClient = createDynamicClient({
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
  autoInitialize: false,
  metadata: { name: "External Wallets Demo" },
});

let initialized = false;

/**
 * Adds the EVM + Solana WaaS extensions and initializes the client.
 * Safe to call multiple times — initialization runs once.
 */
export async function initDynamic(): Promise<void> {
  if (initialized) return;
  initialized = true;
  addWaasEvmExtension(dynamicClient);
  addWaasSolanaExtension(dynamicClient);
  await initializeClient(dynamicClient);
}
