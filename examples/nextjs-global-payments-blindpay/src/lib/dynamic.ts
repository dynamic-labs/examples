import {
  createDynamicClient,
  initializeClient,
  type DynamicClient,
} from "@dynamic-labs-sdk/client";
import { addWaasEvmExtension } from "@dynamic-labs-sdk/evm/waas";

export const dynamicClient: DynamicClient = createDynamicClient({
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID!,
  autoInitialize: false,
  metadata: { name: "BlindPay Global Payments" },
});

let initialized = false;

export async function initDynamic(): Promise<void> {
  if (initialized) return;
  initialized = true;
  addWaasEvmExtension(dynamicClient);
  await initializeClient(dynamicClient);
}
