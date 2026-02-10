"use client";

/**
 * Solana Transactions
 *
 * Sign and send transactions on Solana.
 *
 * @see https://www.dynamic.xyz/docs/javascript/reference/solana/signing-sending-transactions
 */

import { signAndSendTransaction as sdkSignAndSendTransaction } from "@dynamic-labs-sdk/solana";

/**
 * Sign and send a Solana transaction.
 * The wallet account must be a Solana wallet.
 */
export const signAndSendTransaction = sdkSignAndSendTransaction;
