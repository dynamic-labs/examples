import { z } from "zod";

/**
 * Schema for delegation query parameters
 *
 * This schema validates the query parameters for the /api/delegation endpoint.
 *
 * Fields:
 * - address: Wallet address (required)
 * - chain: Chain identifier (e.g., "EVM") (required)
 */
export const DelegationQuerySchema = z.object({
  address: z.string().min(1, "address is required"),
  chain: z.string().min(1, "chain is required"),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type DelegationQuery = z.infer<typeof DelegationQuerySchema>;

