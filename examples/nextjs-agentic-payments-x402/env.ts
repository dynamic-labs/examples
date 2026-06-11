/**
 * Environment variable configuration and validation
 *
 * Type-safe env vars via @t3-oss/env-nextjs, validated at startup.
 *
 * Server (never sent to the browser):
 * - DYNAMIC_API_TOKEN              API token for server-side Dynamic operations
 * - DYNAMIC_WEBHOOK_SECRET         Verifies Dynamic webhook signatures
 * - DYNAMIC_DELEGATION_PRIVATE_KEY RSA private key that decrypts delegation shares
 * - SUPABASE_URL                   Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY      Supabase service-role key (server only)
 * - DELEGATION_ENCRYPTION_KEY      32-byte hex AES-256-GCM key for encryption at rest
 * - X402_PAY_TO                    Address that receives x402 service payments
 * - BASE_RPC_URL                   Optional RPC override for balance reads
 *
 * Client (public):
 * - NEXT_PUBLIC_DYNAMIC_ENV_ID     Dynamic environment ID
 *
 * The network is hardcoded to Base Sepolia (see lib/shared/constants.ts); the
 * public x402 facilitator settles testnet for free, so no CDP keys are needed.
 */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DYNAMIC_API_TOKEN: z.string(),
    DYNAMIC_WEBHOOK_SECRET: z.string(),
    DYNAMIC_DELEGATION_PRIVATE_KEY: z.string(),
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    DELEGATION_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, "Must be a 64-char hex string (32 bytes)"),
    X402_PAY_TO: z.string().startsWith("0x"),
    BASE_RPC_URL: z.url().optional(),
  },
  client: {
    NEXT_PUBLIC_DYNAMIC_ENV_ID: z.string(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_DYNAMIC_ENV_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
    DYNAMIC_API_TOKEN: process.env.DYNAMIC_API_TOKEN,
    DYNAMIC_WEBHOOK_SECRET: process.env.DYNAMIC_WEBHOOK_SECRET,
    DYNAMIC_DELEGATION_PRIVATE_KEY: process.env.DYNAMIC_DELEGATION_PRIVATE_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DELEGATION_ENCRYPTION_KEY: process.env.DELEGATION_ENCRYPTION_KEY,
    X402_PAY_TO: process.env.X402_PAY_TO,
    BASE_RPC_URL: process.env.BASE_RPC_URL,
  },
});
