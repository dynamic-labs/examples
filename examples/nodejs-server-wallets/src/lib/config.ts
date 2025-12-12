/**
 * Centralized Configuration
 *
 * All chain and demo configuration constants in one place.
 * Modify these values to customize the demos for your use case.
 */

import { baseSepolia } from "viem/chains";

/** Default chain for all demos */
export const DEFAULT_CHAIN = baseSepolia;

/** USDC token decimals (standard for USDC) */
export const USDC_DECIMALS = 6;

/** Maximum USDC amount per wallet in omnibus demo */
export const MAX_USDC_AMOUNT = 1000;

/** Number of confirmations to wait for transactions */
export const TRANSACTION_CONFIRMATIONS = 1;

/** Concurrency limits for API rate limiting */
export const WALLET_CREATION_LIMIT = 5;
export const TRANSACTION_LIMIT = 25;
