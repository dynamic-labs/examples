import { createDynamicClient } from "@dynamic-labs-sdk/client";
import { addSolanaExtension } from "@dynamic-labs-sdk/solana";

// Create the Dynamic client once. Extensions must be registered immediately
// after createDynamicClient() and before initialization completes.
export const dynamicClient = createDynamicClient({
  environmentId:
    process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID ||
    "9405948e-3dc1-4402-86c1-7b8e7f88542d",
  metadata: {
    name: "Kamino Earn with Dynamic",
  },
});

// Register Solana extension — takes NO arguments
addSolanaExtension();
