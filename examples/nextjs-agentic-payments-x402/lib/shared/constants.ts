/**
 * Network + token constants. Framework-agnostic (no Next imports) so this is
 * shared by the Next app, the x402 route gate, and the standalone agent.
 *
 * The demo runs on **Base Sepolia** (testnet) only — hardcoded, single network.
 */
import { baseSepolia } from "viem/chains";
import type { Chain } from "viem";

/** x402 v2 network identifier (CAIP-2). */
export const X402_NETWORK = "eip155:84532" as const;
/** MoonPay / wallet network id (numeric chain id as a string). */
export const NETWORK_ID = "84532";
/** Circle USDC on Base Sepolia. */
export const USDC_ADDRESS: `0x${string}` =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const USDC_DECIMALS = 6;
export const VIEM_CHAIN: Chain = baseSepolia;
/** RPC for reads; override with BASE_RPC_URL. */
export const RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";

/** The chain string Dynamic uses for EVM delegations (webhook `data.chain`). */
export const DELEGATION_CHAIN = "EVM";

/** Minimal ERC-20 ABI for reading a balance. */
export const ERC20_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** Format a USDC base-unit amount (bigint) as a plain USD string, e.g. "12.50". */
export function formatUsd(baseUnits: bigint): string {
  const cents = baseUnits / BigInt(10 ** (USDC_DECIMALS - 2));
  return (Number(cents) / 100).toFixed(2);
}
