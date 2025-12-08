import type { DelegationRecord } from "@/lib/dynamic/delegation/types";
import { getRedisClient } from "../../redis";

/**
 * Delegation-specific Redis key helpers
 */
function getDelegationKey(userId: string, chain: string): string {
  return `delegation:${userId}:${chain}`;
}

function getUserDelegationsKey(userId: string): string {
  return `delegations:${userId}`;
}

function getAddressDelegationsKey(address: string): string {
  return `delegations:address:${address.toLowerCase()}`;
}

function getAddressChainDelegationKey(address: string, chain: string): string {
  return `delegation:address:${address.toLowerCase()}:${chain}`;
}

/**
 * Redis-based storage for delegated shares
 *
 * ⚠️ WARNING: This Redis implementation is for DEVELOPMENT/DEMO purposes only.
 * Redis is NOT recommended for production applications storing sensitive delegation data.
 *
 * Local Development:
 * - Install Redis: `brew install redis` (macOS) or `apt-get install redis` (Linux)
 * - Start Redis: `redis-server`
 * - No env vars needed - automatically uses local Redis at redis://localhost:6379
 * - Or set KV_URL="redis://localhost:6379" to use a different Redis instance
 *
 * This implementation:
 * - Uses Vercel KV if KV_REST_API_URL and KV_REST_API_TOKEN are configured
 * - Falls back to local Redis (defaults to redis://localhost:6379) otherwise
 *
 * Production Storage Recommendations:
 *
 * 1. **Use encrypted databases with encryption at rest**:
 *    - AWS RDS with encryption enabled
 *    - Google Cloud SQL with encryption at rest
 *    - Azure Database with Transparent Data Encryption (TDE)
 *    - MongoDB Atlas with encryption at rest
 *
 * 2. **Secure key management**:
 *    - AWS KMS: Decrypt without ever exposing the private key
 *    - Google Cloud KMS: Similar to AWS KMS
 *    - Azure Key Vault: Microsoft's key management solution
 *    - HashiCorp Vault: Self-hosted option with Transit engine
 *    - Never store encryption keys in environment variables or code
 *
 * 3. **Best practices**:
 *    - Decrypt shares on-demand, not at storage time
 *    - Use separate encryption keys for different environments
 *    - Rotate encryption keys periodically
 *    - Implement field-level encryption for sensitive data
 *    - Log all access to delegation shares with audit trails
 *    - Implement rate limiting and access controls
 *    - Enable database access logging for compliance
 *
 * Redis key structure (development only):
 * - delegation:{userId}:{chain} - Individual delegation record (JSON)
 * - delegation:address:{address}:{chain} - Delegation record indexed by address (JSON)
 * - delegations:{userId} - Set of chain IDs for a user
 * - delegations:address:{address} - Set of chain IDs for an address
 */

/**
 * Store a delegation record for a user on a specific chain
 */
export async function storeDelegation(record: DelegationRecord): Promise<void> {
  const redis = getRedisClient();
  const delegationKey = getDelegationKey(record.userId, record.chain);
  const userDelegationsKey = getUserDelegationsKey(record.userId);
  const addressDelegationsKey = getAddressDelegationsKey(record.address);
  const addressChainDelegationKey = getAddressChainDelegationKey(
    record.address,
    record.chain
  );

  const recordJson = JSON.stringify(record);

  await redis.set(delegationKey, recordJson);
  await redis.set(addressChainDelegationKey, recordJson);
  await redis.sadd(userDelegationsKey, record.chain);
  await redis.sadd(addressDelegationsKey, record.chain);

  console.log(
    `✅ Stored delegation for user ${record.userId} on ${record.chain}`
  );
}

/**
 * Get a delegation record for a specific user and chain
 */
export async function getDelegation(
  userId: string,
  chain: string
): Promise<DelegationRecord | undefined> {
  const redis = getRedisClient();
  const delegationKey = getDelegationKey(userId, chain);

  const data = await redis.get(delegationKey);
  if (!data) return undefined;

  try {
    return JSON.parse(data as string) as DelegationRecord;
  } catch (error) {
    console.error(
      `Failed to parse delegation record for ${delegationKey}:`,
      error
    );
    return undefined;
  }
}

/**
 * Get a delegation record by address and chain
 */
export async function getDelegationByAddress(
  address: string,
  chain: string
): Promise<DelegationRecord | undefined> {
  const redis = getRedisClient();
  const addressChainDelegationKey = getAddressChainDelegationKey(
    address,
    chain
  );

  const data = await redis.get(addressChainDelegationKey);
  if (!data) return undefined;

  try {
    return JSON.parse(data as string) as DelegationRecord;
  } catch (error) {
    console.error(
      `Failed to parse delegation record for ${addressChainDelegationKey}:`,
      error
    );
    return undefined;
  }
}

/**
 * Get all delegations for a user or address across all chains
 *
 * @param userId - User ID to fetch delegations for (optional if address is provided)
 * @param address - Wallet address to fetch delegations for (optional if userId is provided)
 * @returns Array of delegation records
 */
export async function getAllDelegations(
  userId?: string,
  address?: string
): Promise<DelegationRecord[]> {
  if (address) {
    return getAllDelegationsByAddress(address);
  }
  if (userId) {
    return getAllDelegationsByUserId(userId);
  }
  throw new Error("Either userId or address must be provided");
}

/**
 * Get all delegations for a user across all chains
 */
async function getAllDelegationsByUserId(
  userId: string
): Promise<DelegationRecord[]> {
  const redis = getRedisClient();
  const userDelegationsKey = getUserDelegationsKey(userId);

  const chains = await redis.smembers(userDelegationsKey);
  if (!chains || chains.length === 0) return [];

  const delegationPromises = chains.map((chain: string) =>
    getDelegation(userId, chain)
  );
  const delegations = await Promise.all(delegationPromises);

  return delegations.filter(
    (record: DelegationRecord | undefined): record is DelegationRecord =>
      record !== undefined
  );
}

/**
 * Get all delegations for an address across all chains
 */
export async function getAllDelegationsByAddress(
  address: string
): Promise<DelegationRecord[]> {
  const redis = getRedisClient();
  const addressDelegationsKey = getAddressDelegationsKey(address);

  const chains = await redis.smembers(addressDelegationsKey);
  if (!chains || chains.length === 0) return [];

  const delegationPromises = chains.map((chain: string) =>
    getDelegationByAddress(address, chain)
  );
  const delegations = await Promise.all(delegationPromises);

  return delegations.filter(
    (record: DelegationRecord | undefined): record is DelegationRecord =>
      record !== undefined
  );
}

/**
 * Delete a delegation record
 */
export async function deleteDelegation(
  userId: string,
  chain: string
): Promise<boolean> {
  const redis = getRedisClient();
  const delegationKey = getDelegationKey(userId, chain);
  const userDelegationsKey = getUserDelegationsKey(userId);

  // Get the record to also remove from address index
  const record = await getDelegation(userId, chain);
  const addressDelegationsKey = record
    ? getAddressDelegationsKey(record.address)
    : null;
  const addressChainDelegationKey = record
    ? getAddressChainDelegationKey(record.address, chain)
    : null;

  const deleted = await redis.del(delegationKey);
  await redis.srem(userDelegationsKey, chain);

  if (addressDelegationsKey && addressChainDelegationKey) {
    await redis.del(addressChainDelegationKey);
    await redis.srem(addressDelegationsKey, chain);
    const remainingAddressChains = await redis.smembers(addressDelegationsKey);
    if (!remainingAddressChains || remainingAddressChains.length === 0) {
      await redis.del(addressDelegationsKey);
    }
  }

  const remainingChains = await redis.smembers(userDelegationsKey);
  if (!remainingChains || remainingChains.length === 0) {
    await redis.del(userDelegationsKey);
  }

  return deleted > 0;
}

/**
 * Clear all delegations (useful for testing)
 *
 * ⚠️ WARNING: This deletes ALL delegation records.
 * Use with caution in production environments.
 */
export async function clearAllDelegations(): Promise<void> {
  const redis = getRedisClient();

  try {
    const keys = await redis.keys("delegation:*");
    const userKeys = await redis.keys("delegations:*");

    if (keys.length > 0) await redis.del(...keys);
    if (userKeys.length > 0) await redis.del(...userKeys);

    console.log(`🗑️  Cleared ${keys.length} delegation records from Redis`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("keys")) {
      console.warn(
        "⚠️  keys() method not available. clearAllDelegations() requires direct Redis access."
      );
      throw new Error(
        "clearAllDelegations() requires direct Redis access. keys() is not available in REST API mode."
      );
    }
    throw error;
  }
}
