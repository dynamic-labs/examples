import { PublicKey } from "@solana/web3.js";

/**
 * Solana token addresses on mainnet
 */
export const SOLANA_TOKENS = {
  // USDC on Solana mainnet
  USDC: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  // Native SOL (wrapped)
  SOL: new PublicKey("11111111111111111111111111111111"),
} as const;

/**
 * DFlow program addresses (placeholder - will be updated with actual addresses)
 */
export const DFLOW_PROGRAMS = {
  // DFlow Trade Program
  TRADE_PROGRAM: "DFLowXvfTXVLf5YhKZDLW8x7S8zxzzMhvjxB8Wx5tRhA",
  // DFlow Predictions Market Program
  PREDICTIONS_PROGRAM: "DFLprEd9Qy8yLwYWaUfDVKkkHLKjfqh2AzdJcCa2HqYT",
} as const;

/**
 * Token decimals
 */
export const TOKEN_DECIMALS = {
  USDC: 6,
  SOL: 9,
} as const;

/**
 * Format amount with proper decimals
 */
export function formatTokenAmount(
  amount: number | bigint,
  decimals: number
): string {
  const value = typeof amount === "bigint" ? Number(amount) : amount;
  return (value / Math.pow(10, decimals)).toFixed(2);
}

/**
 * Parse amount to smallest units
 */
export function parseTokenAmount(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

