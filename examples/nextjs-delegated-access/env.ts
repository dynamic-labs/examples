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
