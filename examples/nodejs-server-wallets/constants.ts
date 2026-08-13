import { config } from "dotenv";
import { baseSepolia } from "viem/chains";

config({ quiet: true });

export const DYNAMIC_API_TOKEN = process.env.DYNAMIC_API_TOKEN!;
export const DYNAMIC_ENVIRONMENT_ID = process.env.DYNAMIC_ENVIRONMENT_ID!;

/**
 * RPC endpoint used for reads only (EIP-7702 delegation status, EOA nonces,
 * transaction receipts). Dynamic's relayer broadcasts sponsored transactions,
 * so this is never used to submit them.
 *
 * Defaults to the public Base Sepolia endpoint, which is heavily rate limited —
 * set RPC_URL to your own provider before running the omnibus demo.
 */
export const RPC_URL =
  process.env.RPC_URL || baseSepolia.rpcUrls.default.http[0];

/**
 * Default EVM chain for the examples.
 *
 * EVM-specific by construction (it is a viem chain), which is why it lives here
 * rather than in a chain-agnostic module.
 */
export const DEFAULT_CHAIN = baseSepolia;

/** USDC token decimals (standard for USDC). */
export const USDC_DECIMALS = 6;

/**
 * Solana RPC endpoint. Unlike the EVM side, this one *does* submit transactions:
 * Dynamic sponsors SVM fees by replacing the fee payer, but your server still
 * broadcasts the signed transaction itself.
 *
 * Defaults to public devnet, which is heavily rate limited.
 */
export const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

/** Cluster label used for Solana explorer links. */
export const SOLANA_CLUSTER = process.env.SOLANA_CLUSTER || "devnet";

// Contract addresses by chain ID
export const CONTRACTS = {
  84532: { USDC: "0x678d798938bd326d76e5db814457841d055560d0" },
} as const;

export const TOKEN_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_amountDollars", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
