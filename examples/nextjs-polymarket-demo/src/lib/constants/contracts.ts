import { POLYGON_MAINNET_CHAIN_ID } from "./network";

/**
 * Contract addresses for different networks
 */
export const CONTRACTS = {
  [String(POLYGON_MAINNET_CHAIN_ID)]: {
    // USDC.e (bridged from Ethereum) - required for Polymarket trading
    USD: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  },
} as const;

/**
 * Polymarket contract addresses on Polygon
 */
export const POLYMARKET_CONTRACTS = {
  // USDC.e (bridged from Ethereum) - Polymarket uses this one
  USDC_E: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const,
  // CTF (Conditional Tokens Framework) - the ERC1155 outcome token contract
  CTF: "0x4d97dcd97ec945f40cf65f87097ace5ea0476045" as const,
  // CTF Exchange - the main exchange contract
  CTF_EXCHANGE: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E" as const,
  // Neg Risk CTF Exchange - for negative risk markets
  NEG_RISK_CTF_EXCHANGE: "0xC5d563A36AE78145C45a50134d48A1215220f80a" as const,
  // Neg Risk Adapter
  NEG_RISK_ADAPTER: "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296" as const,
};

/**
 * All contracts that need USDC approval for Polymarket trading
 * These are the exchange contracts that need to spend your USDC
 */
export const POLYMARKET_USDC_SPENDERS = [
  { address: POLYMARKET_CONTRACTS.CTF_EXCHANGE, name: "Main Exchange" },
  {
    address: POLYMARKET_CONTRACTS.NEG_RISK_CTF_EXCHANGE,
    name: "Neg Risk Markets",
  },
  { address: POLYMARKET_CONTRACTS.NEG_RISK_ADAPTER, name: "Neg Risk Adapter" },
] as const;

/**
 * All contracts that need ERC1155 (Conditional Token) approval for Polymarket trading
 * These are the exchange contracts that need to transfer your outcome tokens
 */
export const POLYMARKET_OUTCOME_TOKEN_SPENDERS = [
  { address: POLYMARKET_CONTRACTS.CTF_EXCHANGE, name: "Main Exchange" },
  {
    address: POLYMARKET_CONTRACTS.NEG_RISK_CTF_EXCHANGE,
    name: "Neg Risk Markets",
  },
  { address: POLYMARKET_CONTRACTS.NEG_RISK_ADAPTER, name: "Neg Risk Adapter" },
] as const;

/**
 * ERC-20 Token ABI for mint function
 */
export const TOKEN_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amountDollars",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * ERC-20 ABI for allowance and approval
 */
export const ERC20_APPROVAL_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * ERC-1155 ABI for outcome token approvals
 */
export const ERC1155_APPROVAL_ABI = [
  {
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Gets the contract address for a given network and contract name
 * @param networkId - Network identifier (chain ID or name)
 * @param contractName - Name of the contract (e.g., "USD")
 * @returns Contract address or undefined if not found
 */
export function getContractAddress(
  networkId: string | number,
  contractName: string
): `0x${string}` | undefined {
  const networkContracts = (CONTRACTS as Record<string, any>)[networkId];
  if (networkContracts && contractName in networkContracts) {
    return networkContracts[contractName];
  }
  return undefined;
}
