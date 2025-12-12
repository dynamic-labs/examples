import { EcdsaKeygenResult } from "@dynamic-labs-wallet/node";

/**
 * Represents a stored delegation record
 *
 * This contains all the information needed to perform
 * delegated transactions on behalf of a user.
 */
export interface DelegationRecord {
  /** Dynamic user ID */
  userId: string;

  /** Blockchain network (e.g., "eip155:1" for Ethereum mainnet) */
  chain: string;

  /** Wallet ID from Dynamic */
  walletId: string;

  /** The wallet's address */
  address: string;

  /** The decrypted delegation share (TSS key share) */
  delegatedShare: EcdsaKeygenResult;

  /** The decrypted wallet API key for Dynamic API calls */
  walletApiKey: string;
}
