import { z } from "zod";

/**
 * Schema for signing a message request body
 *
 * This schema validates the request body for the /api/delegation/sign endpoint.
 *
 * Fields:
 * - address: Wallet address (required)
 * - chain: Chain identifier (e.g., "EVM") (required)
 * - message: Message to sign (required, non-empty string)
 */
export const SignMessageRequestSchema = z.object({
  address: z.string().min(1, "address is required"),
  chain: z.string().min(1, "chain is required"),
  message: z.string().min(1, "message is required"),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type SignMessageRequest = z.infer<typeof SignMessageRequestSchema>;
