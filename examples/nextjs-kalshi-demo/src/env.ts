import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_DYNAMIC_ENV_ID: z.string(),
    // Solana RPC endpoint (optional, defaults to mainnet-beta)
    NEXT_PUBLIC_SOLANA_RPC_URL: z.string().optional(),
    // DFlow API key (optional - for authenticated requests)
    NEXT_PUBLIC_DFLOW_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_DYNAMIC_ENV_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    NEXT_PUBLIC_DFLOW_API_KEY: process.env.NEXT_PUBLIC_DFLOW_API_KEY,
  },
});

