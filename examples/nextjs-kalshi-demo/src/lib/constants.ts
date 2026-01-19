/**
 * DFlow API Configuration
 */
export const DFLOW_TRADE_API_URL = "https://c.quote-api.dflow.net";
export const DFLOW_METADATA_API_URL =
  "https://c.prediction-markets-api.dflow.net";

/**
 * Solana Token Mint Addresses
 */
export const WSOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/**
 * Trading Configuration
 */
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
export const MIN_BET_USD = 5;
export const SOL_PRICE_ESTIMATE = 200;
export const TX_FEE_RESERVE = 0.01; // SOL

/**
 * Solana RPC
 */
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";
