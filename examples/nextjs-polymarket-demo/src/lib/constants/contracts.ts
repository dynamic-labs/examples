import { POLYGON_MAINNET_CHAIN_ID } from "./network";

export const CONTRACTS = {
  [String(POLYGON_MAINNET_CHAIN_ID)]: {
    USD: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  },
} as const;

export const POLYMARKET_CONTRACTS = {
  USDC_E: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const,
  CTF: "0x4d97dcd97ec945f40cf65f87097ace5ea0476045" as const,
  CTF_EXCHANGE: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E" as const,
  NEG_RISK_CTF_EXCHANGE: "0xC5d563A36AE78145C45a50134d48A1215220f80a" as const,
  NEG_RISK_ADAPTER: "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296" as const,
};

export const POLYMARKET_USDC_SPENDERS = [
  { address: POLYMARKET_CONTRACTS.CTF_EXCHANGE, name: "Main Exchange" },
  {
    address: POLYMARKET_CONTRACTS.NEG_RISK_CTF_EXCHANGE,
    name: "Neg Risk Markets",
  },
  { address: POLYMARKET_CONTRACTS.NEG_RISK_ADAPTER, name: "Neg Risk Adapter" },
] as const;

export const POLYMARKET_OUTCOME_TOKEN_SPENDERS = [
  { address: POLYMARKET_CONTRACTS.CTF_EXCHANGE, name: "Main Exchange" },
  {
    address: POLYMARKET_CONTRACTS.NEG_RISK_CTF_EXCHANGE,
    name: "Neg Risk Markets",
  },
  { address: POLYMARKET_CONTRACTS.NEG_RISK_ADAPTER, name: "Neg Risk Adapter" },
] as const;

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

export function getContractAddress(
  networkId: string | number,
  contractName: string
): `0x${string}` | undefined {
  const networkContracts = (CONTRACTS as Record<string, Record<string, `0x${string}`>>)[String(networkId)];
  if (networkContracts && contractName in networkContracts) {
    return networkContracts[contractName];
  }
  return undefined;
}
