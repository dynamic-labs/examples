import { getNetworkConfigOrDefault, DEFAULT_NETWORK } from "./networks";

// Legacy exports for backward compatibility
// These will be deprecated in favor of the new network system
export const CONTRACTS = {
  REWARDS_DISTRIBUTOR: "0x3B14E5C73e0a56D607A8688098326fD4b4292135",
  MORPHO_MARKETS: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
} as const;

export const MARKET_PARAMS = {
  loanToken: "0x4200000000000000000000000000000000000006",
  collateralToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  oracle: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  irm: "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
  lltv: BigInt("850000000000000000"),
} as const;

export const NETWORK = {
  CHAIN_ID: DEFAULT_NETWORK,
  NAME: "Base",
} as const;

export const API = {
  MORPHO_GRAPHQL: "https://api.morpho.org/graphql",
} as const;

export const DECIMALS = {
  MORPHO: 18,
  WETH: 18,
} as const;

// Helper functions for getting network-specific data
export function getContractsForChain(chainId: number) {
  const config = getNetworkConfigOrDefault(chainId);
  return config.contracts;
}

export function getMarketParamsForChain(chainId: number) {
  const config = getNetworkConfigOrDefault(chainId);
  return config.marketParams;
}

export function getApiForChain(chainId: number) {
  const config = getNetworkConfigOrDefault(chainId);
  return config.api;
}

export function getDecimalsForChain(chainId: number) {
  const config = getNetworkConfigOrDefault(chainId);
  return config.decimals;
}
