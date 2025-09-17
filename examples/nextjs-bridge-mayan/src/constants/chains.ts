import {
  mainnet,
  polygon,
  bsc,
  avalanche,
  arbitrum,
  optimism,
  base,
} from "viem/chains";

export type ChainKey =
  | "ethereum"
  | "polygon"
  | "bsc"
  | "avalanche"
  | "arbitrum"
  | "optimism"
  | "base"
  | "solana"
  | "sui"
  | "hypercore";

export const EVM_CHAINS: { id: number; name: string; key: ChainKey }[] = [
  {
    id: mainnet.id,
    name: "Ethereum Mainnet",
    key: "ethereum",
  },
  {
    id: polygon.id,
    name: "Polygon",
    key: "polygon",
  },
  {
    id: bsc.id,
    name: "BSC",
    key: "bsc",
  },
  {
    id: avalanche.id,
    name: "Avalanche",
    key: "avalanche",
  },
  {
    id: arbitrum.id,
    name: "Arbitrum",
    key: "arbitrum",
  },
  {
    id: optimism.id,
    name: "Optimism",
    key: "optimism",
  },
  {
    id: base.id,
    name: "Base",
    key: "base",
  },
];

// Non-EVM chains supported by Mayan
export const NON_EVM_CHAINS: { id: string; name: string; key: ChainKey }[] = [
  {
    id: "solana",
    name: "Solana",
    key: "solana",
  },
  {
    id: "sui",
    name: "Sui",
    key: "sui",
  },
  {
    id: "hypercore",
    name: "HyperCore (Hyperliquid)",
    key: "hypercore",
  },
];

// All supported chains
export const ALL_CHAINS = [...EVM_CHAINS, ...NON_EVM_CHAINS];

// Utility functions
export const isEVMChain = (chain: {
  id: number | string;
  key: ChainKey;
}): boolean => {
  return typeof chain.id === "number";
};

export const getChainById = (
  id: number | string
): { id: number | string; name: string; key: ChainKey } | undefined => {
  return ALL_CHAINS.find((chain) => chain.id === id);
};

export const getChainByKey = (
  key: ChainKey
): { id: number | string; name: string; key: ChainKey } | undefined => {
  return ALL_CHAINS.find((chain) => chain.key === key);
};
