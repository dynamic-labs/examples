import { EVM_CHAINS } from "@/constants/chains";

// Mayan Finance Price API integration for EVM chains only
const MAYAN_PRICE_API_BASE = "https://price-api.mayan.finance";

// Type definitions for the Mayan Finance API response
export interface MayanApiToken {
  name: string;
  standard: string;
  symbol: string;
  mint: string;
  verified: boolean;
  contract: string;
  wrappedAddress?: string;
  chainId: number;
  wChainId: number;
  decimals: number;
  logoURI: string;
  coingeckoId: string;
  pythUsdPriceId?: string;
  realOriginContractAddress: string;
  realOriginChainId: number;
  supportsPermit: boolean;
  hasAuction: boolean;
  peggedAsset?: string;
}

export interface MayanApiResponse {
  [chainKey: string]: MayanApiToken[];
}

// Type for our internal token format
export interface TokenData {
  contract: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
  price?: number;
  priceChange24h?: number;
}

/**
 * Get chain key from chain ID using the constants
 */
const getChainKeyFromId = (chainId: number): string | null => {
  const chain = EVM_CHAINS.find((chain) => chain.id === chainId);
  return chain?.key || null;
};

/**
 * Get all supported chain keys from constants
 */
export const getSupportedChainKeys = (): string[] => {
  return EVM_CHAINS.map((chain) => chain.key);
};

/**
 * Get all supported chain IDs from constants
 */
export const getSupportedChainIds = (): number[] => {
  return EVM_CHAINS.map((chain) => chain.id);
};

/**
 * Fetch all tokens for a specific EVM chain from Mayan Finance Price API
 */
export const fetchTokensForChain = async (
  chainId: number
): Promise<TokenData[]> => {
  try {
    const chainKey = getChainKeyFromId(chainId);
    if (!chainKey) {
      console.warn(`Unsupported EVM chain ID: ${chainId}`);
      return [];
    }

    return await fetchTokensByChainKey(chainKey);
  } catch (error) {
    console.error(`Error fetching tokens for chain ${chainId}:`, error);
    return [];
  }
};

/**
 * Fetch all tokens for a specific chain using the chain key directly
 */
export const fetchTokensByChainKey = async (
  chainKey: string
): Promise<TokenData[]> => {
  try {
    const response = await fetch(
      `${MAYAN_PRICE_API_BASE}/v3/tokens?chain=${chainKey}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch tokens for chain ${chainKey}: ${response.statusText}`
      );
    }

    const data: MayanApiResponse = await response.json();
    const chainTokens = data[chainKey];

    if (!chainTokens || !Array.isArray(chainTokens)) {
      console.warn(`No tokens found for chain ${chainKey}`);
      return [];
    }

    // Transform the API response to our token format
    const tokens: TokenData[] = chainTokens.map((token: MayanApiToken) => ({
      contract: token.contract,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.logoURI,
      chainId: token.chainId,
      // Note: Price data is not included in the tokens endpoint
      // You would need to call a separate price endpoint for this
    }));

    return tokens;
  } catch (error) {
    console.error(`Error fetching tokens for chain ${chainKey}:`, error);
    return [];
  }
};

/**
 * Fetch token price for a specific token on a specific EVM chain
 * Note: This would require a separate price endpoint from Mayan
 */
export const fetchTokenPrice = async (
  chainId: number,
  tokenAddress: string
): Promise<number | null> => {
  try {
    const chainKey = getChainKeyFromId(chainId);
    if (!chainKey) {
      throw new Error(`Unsupported EVM chain ID: ${chainId}`);
    }

    // This endpoint structure may need to be adjusted based on actual Mayan API
    const response = await fetch(
      `${MAYAN_PRICE_API_BASE}/v3/tokens/${chainKey}/${tokenAddress}/price`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch price for token ${tokenAddress} on chain ${chainKey}`
      );
    }

    const data: { price: number } = await response.json();
    return data.price || null;
  } catch (error) {
    console.error(
      `Error fetching token price for ${tokenAddress} on chain ${chainId}:`,
      error
    );
    return null;
  }
};

/**
 * Get popular tokens for a specific EVM chain
 */
export const getPopularTokens = async (
  chainId: number,
  limit = 10
): Promise<TokenData[]> => {
  try {
    const allTokens = await fetchTokensForChain(chainId);

    // For now, return the first N tokens since we don't have price data
    // You could enhance this by calling a separate price endpoint
    return allTokens.slice(0, limit);
  } catch (error) {
    console.error(`Error fetching popular tokens for chain ${chainId}:`, error);
    return [];
  }
};

/**
 * Search tokens by symbol or name on a specific EVM chain
 */
export const searchTokensOnChain = async (
  chainId: number,
  query: string
): Promise<TokenData[]> => {
  try {
    const allTokens = await fetchTokensForChain(chainId);

    if (!query) return allTokens;

    const searchTerm = query.toLowerCase();
    return allTokens.filter(
      (token: TokenData) =>
        token.symbol.toLowerCase().includes(searchTerm) ||
        token.name.toLowerCase().includes(searchTerm)
    );
  } catch (error) {
    console.error(`Error searching tokens on chain ${chainId}:`, error);
    return [];
  }
};
