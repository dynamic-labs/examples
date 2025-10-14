import { config } from "dotenv";
config();

export const DYNAMIC_API_TOKEN = process.env.DYNAMIC_API_TOKEN!;
export const DYNAMIC_ENVIRONMENT_ID = process.env.DYNAMIC_ENVIRONMENT_ID!;
export const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY!;

export const ACCOUNT_IMPLEMENTATION_ADDRESS =
  "0xe6Cae83BdE06E4c305530e199D7217f42808555B" as `0x${string}`;

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
