import {
  createDelegatedEvmWalletClient,
  DynamicEvmWalletClient,
} from "@dynamic-labs-wallet/node-evm";
import { env } from "@/env";

/**
 * Creates an authenticated Dynamic EVM client for server-side wallet operations
 *
 * This client is used for server-side operations that require authentication with Dynamic's API.
 * It's configured with MPC acceleration enabled for faster cryptographic operations.
 *
 * Use cases:
 * - Server-side wallet operations that don't require delegation shares
 * - Administrative operations on wallets
 * - Batch operations or background jobs
 *
 * For delegated wallet operations (signing with user's delegated share), use
 * `delegatedEvmClient()` instead.
 *
 * Configuration:
 * - MPC Accelerator: Enabled for faster cryptographic operations
 * - Relay API: Uses Dynamic's relay service at relay.dynamicauth.com
 * - Authentication: Uses DYNAMIC_API_TOKEN from environment variables
 *
 * @returns An authenticated DynamicEvmWalletClient instance ready for use
 * @throws Error if DYNAMIC_API_TOKEN or NEXT_PUBLIC_DYNAMIC_ENV_ID are not set
 *
 * @example
 * ```typescript
 * const client = await createAuthenticatedEvmClient();
 * // Use client for server-side operations
 * ```
 */
export async function createAuthenticatedEvmClient(): Promise<DynamicEvmWalletClient> {
  const client = new DynamicEvmWalletClient({
    environmentId: env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
    enableMPCAccelerator: true,
    baseMPCRelayApiUrl: "relay.dynamicauth.com",
  });

  await client.authenticateApiToken(env.DYNAMIC_API_TOKEN);
  return client;
}

/**
 * Creates a delegated EVM wallet client for signing operations with user's delegated share
 *
 * This client is used for server-side operations that require the user's delegated share
 * to sign messages or transactions on their behalf. The client is configured with your
 * Dynamic environment ID and API token.
 *
 * Use cases:
 * - Signing messages with delegated wallet shares
 * - Signing transactions with delegated wallet shares
 * - Any operation requiring the user's delegated key share
 *
 * For non-delegated server-side operations (administrative tasks, batch operations),
 * use `createAuthenticatedEvmClient()` instead.
 *
 * Configuration:
 * - Environment ID: Uses NEXT_PUBLIC_DYNAMIC_ENV_ID from environment variables
 * - API Token: Uses DYNAMIC_API_TOKEN from environment variables
 *
 * @returns A delegated EVM wallet client instance ready for use
 * @throws Error if DYNAMIC_API_TOKEN or NEXT_PUBLIC_DYNAMIC_ENV_ID are not set
 *
 * @example
 * ```typescript
 * const client = delegatedEvmClient();
 * // Use with delegatedSignMessage or other delegated operations
 * ```
 */
export const delegatedEvmClient = () => {
  return createDelegatedEvmWalletClient({
    environmentId: env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
    apiKey: env.DYNAMIC_API_TOKEN,
  });
};
