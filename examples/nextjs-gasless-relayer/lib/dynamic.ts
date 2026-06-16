import { createDynamicClient, initializeClient, type DynamicClient } from "@dynamic-labs-sdk/client";
import { addWaasSolanaExtension } from "@dynamic-labs-sdk/solana/waas";

export const dynamicClient: DynamicClient = createDynamicClient({
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID!,
  autoInitialize: false,
  metadata: { name: "Gasless Solana Relayer" },
});

let initialized = false;

export async function initDynamic(): Promise<void> {
  if (initialized) return;
  initialized = true;
  addWaasSolanaExtension(dynamicClient);
  await initializeClient(dynamicClient);
}
