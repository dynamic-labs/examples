import { createDynamicClient, initializeClient, type DynamicClient } from "@dynamic-labs-sdk/client";
import { addWaasEvmExtension } from "@dynamic-labs-sdk/evm/waas";

export const dynamicClient: DynamicClient = createDynamicClient({
  environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
  autoInitialize: false,
  metadata: { name: "Stablecoin Payment Links" },
});

let initialized = false;

export async function initDynamic(): Promise<void> {
  if (initialized) return;
  initialized = true;
  addWaasEvmExtension(dynamicClient);
  await initializeClient(dynamicClient);
}
