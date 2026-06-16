import { createDynamicClient, initializeClient } from "@dynamic-labs-sdk/client";
import { addWaasEvmExtension } from "@dynamic-labs-sdk/evm/waas";

export const dynamicClient = createDynamicClient({
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
  autoInitialize: false,
  metadata: { name: "Dynamic Sidebar Widget Demo" },
});

let initialized = false;

export async function initDynamic() {
  if (initialized) return;
  initialized = true;
  addWaasEvmExtension(dynamicClient);
  await initializeClient(dynamicClient);
}
