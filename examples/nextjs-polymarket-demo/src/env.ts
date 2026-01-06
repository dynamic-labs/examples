import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    CHECKOUT_SECRET_KEY: z.string(),
    CHECKOUT_API_URL: z.string(),
    CHECKOUT_PROCESSING_CHANNEL_ID: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_DYNAMIC_ENV_ID: z.string(),
    NEXT_PUBLIC_CHECKOUT_PUBLIC_KEY: z.string(),
    NEXT_PUBLIC_CHECKOUT_ENVIRONMENT: z
      .enum(["sandbox", "production"])
      .default("sandbox"),
    NEXT_PUBLIC_LIFI_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_DYNAMIC_ENV_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
    NEXT_PUBLIC_CHECKOUT_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_CHECKOUT_PUBLIC_KEY,
    NEXT_PUBLIC_CHECKOUT_ENVIRONMENT:
      process.env.NEXT_PUBLIC_CHECKOUT_ENVIRONMENT,
    NEXT_PUBLIC_LIFI_API_KEY: process.env.NEXT_PUBLIC_LIFI_API_KEY,
    CHECKOUT_SECRET_KEY: process.env.CHECKOUT_SECRET_KEY,
    CHECKOUT_API_URL: process.env.CHECKOUT_API_URL,
    CHECKOUT_PROCESSING_CHANNEL_ID: process.env.CHECKOUT_PROCESSING_CHANNEL_ID,
  },
});
