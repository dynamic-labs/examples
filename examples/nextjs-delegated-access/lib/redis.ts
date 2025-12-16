import { env } from "@/env";
import { kv } from "@vercel/kv";
import Redis from "ioredis";

/**
 * Generic Redis client configuration
 *
 * Priority:
 * 1. Vercel KV (if KV_REST_API_URL and KV_REST_API_TOKEN are set)
 * 2. Local Redis (defaults to redis://localhost:6379)
 *
 * Environment variables:
 * - KV_REST_API_URL: Vercel KV REST API URL (optional)
 * - KV_REST_API_TOKEN: Vercel KV REST API token (optional)
 * - KV_URL: Redis connection URL (optional, defaults to redis://localhost:6379 for local)
 *
 * For local development:
 * - Install Redis: `brew install redis` (macOS) or `apt-get install redis` (Linux)
 * - Start Redis: `redis-server`
 * - No env vars needed - will automatically use local Redis at redis://localhost:6379
 * - Or set KV_URL="redis://localhost:6379" explicitly
 *
 * For Vercel KV:
 * - Set KV_REST_API_URL and KV_REST_API_TOKEN from your Vercel dashboard
 *
 * For Upstash Redis:
 * - Set KV_URL to your Upstash Redis URL
 */

let localRedisClient: Redis | null = null;

/**
 * Check if Vercel KV REST API is configured
 */
function isVercelKVConfigured(): boolean {
  return !!(env.KV_REST_API_URL && env.KV_REST_API_TOKEN);
}

/**
 * Get local Redis client (singleton)
 */
function getLocalRedisClient(): Redis {
  if (!localRedisClient) {
    const redisUrl = env.KV_URL || "redis://localhost:6379";
    localRedisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return localRedisClient;
}

/**
 * Unified Redis client interface
 * Handles both Vercel KV and ioredis APIs
 */
type RedisClient = {
  set(key: string, value: string): Promise<void | string>;
  get(key: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  keys(pattern: string): Promise<string[]>;
};

/**
 * Wrap Vercel KV to match ioredis API
 */
function wrapVercelKV(): RedisClient {
  return {
    async set(key: string, value: string) {
      await kv.set(key, value);
    },
    async get(key: string) {
      const result = await kv.get<string>(key);
      return result || null;
    },
    async del(...keys: string[]) {
      let count = 0;
      for (const key of keys) {
        const result = await kv.del(key);
        if (result) count++;
      }
      return count;
    },
    async sadd(key: string, ...members: string[]) {
      let count = 0;
      for (const member of members) {
        await kv.sadd(key, member);
        count++;
      }
      return count;
    },
    async srem(key: string, ...members: string[]) {
      let count = 0;
      for (const member of members) {
        await kv.srem(key, member);
        count++;
      }
      return count;
    },
    async smembers(key: string) {
      const result = await kv.smembers<string[]>(key);
      return result || [];
    },
    async keys(pattern: string) {
      // Vercel KV REST API doesn't support keys() - this will throw
      // but we handle it in clearAllDelegations
      const result = await kv.keys(pattern);
      return result || [];
    },
  };
}

/**
 * Get the Redis client instance
 * - Uses Vercel KV if configured
 * - Falls back to local Redis otherwise
 */
export function getRedisClient(): RedisClient {
  if (isVercelKVConfigured()) return wrapVercelKV();
  return getLocalRedisClient();
}
