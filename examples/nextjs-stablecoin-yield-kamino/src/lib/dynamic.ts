import {
  createDynamicClient,
  initializeClient,
  getNetworksData,
  type DynamicClient,
} from "@dynamic-labs-sdk/client";
import { addWaasSolanaExtension } from "@dynamic-labs-sdk/solana/waas";

export const dynamicClient: DynamicClient = createDynamicClient({
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID!,
  autoInitialize: false,
  metadata: {
    name: "Kamino Earn with Dynamic",
  },
});

let initialized = false;

/**
 * Adds the Solana WaaS extension and initializes the client.
 * Safe to call multiple times — initialization runs once.
 */
export async function initDynamic(): Promise<void> {
  if (initialized) return;
  initialized = true;
  addWaasSolanaExtension(dynamicClient);
  await initializeClient(dynamicClient);
}

/**
 * Returns the Solana RPC URL configured in the Dynamic dashboard.
 * Throws if Dynamic has not been configured with a Solana network.
 */
export function getSolanaRpcUrl(): string {
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  }
  const networks = getNetworksData(dynamicClient);
  const solana = networks.find((n) => n.chain === "SOL");
  const url = solana?.rpcUrls.http[0];
  if (!url) {
    throw new Error(
      "No Solana RPC URL found. Set NEXT_PUBLIC_SOLANA_RPC_URL or add a Solana network in your Dynamic dashboard settings.",
    );
  }
  return url;
}
