/**
 * Environment variable configuration and validation
 *
 * This file uses @t3-oss/env-nextjs for type-safe environment variables.
 * All environment variables are validated at build time, ensuring proper configuration.
 *
 * Required variables:
 * - NEXT_PUBLIC_DYNAMIC_ENV_ID: Dynamic environment ID (from dashboard)
 * - DYNAMIC_API_TOKEN: API token for server-side operations
 * - DYNAMIC_WEBHOOK_SECRET: Secret for verifying webhook signatures
 * - DYNAMIC_DELEGATION_PRIVATE_KEY: RSA private key for decrypting delegation shares
 *
 * Optional variables:
 * - KV_URL: Redis connection URL (defaults to redis://localhost:6379)
 * - KV_REST_API_URL: Vercel KV REST API URL
 * - KV_REST_API_TOKEN: Vercel KV REST API token
 */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DYNAMIC_API_TOKEN: z.string(),
    DYNAMIC_WEBHOOK_SECRET: z.string(),
    DYNAMIC_DELEGATION_PRIVATE_KEY: z.string(),
    KV_URL: z.string().optional(),
    KV_REST_API_URL: z.string().optional(),
    KV_REST_API_TOKEN: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_DYNAMIC_ENV_ID: z.string(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_DYNAMIC_ENV_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
    DYNAMIC_API_TOKEN: process.env.DYNAMIC_API_TOKEN,
    DYNAMIC_WEBHOOK_SECRET: process.env.DYNAMIC_WEBHOOK_SECRET,
    DYNAMIC_DELEGATION_PRIVATE_KEY: process.env.DYNAMIC_DELEGATION_PRIVATE_KEY,

    KV_URL: process.env.KV_URL,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  },
});
