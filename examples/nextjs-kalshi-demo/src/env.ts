import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // DFlow API key (optional - for authenticated requests, kept server-side)
    DFLOW_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_DYNAMIC_ENV_ID: z.string(),
    // Solana RPC endpoint (optional, defaults to mainnet-beta)
    NEXT_PUBLIC_SOLANA_RPC_URL: z.string().optional(),
  },
  runtimeEnv: {
    DFLOW_API_KEY: process.env.DFLOW_API_KEY,
    NEXT_PUBLIC_DYNAMIC_ENV_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  },
});
