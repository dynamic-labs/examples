/**
 * Wallet Storage Utilities
 *
 * ⚠️ WARNING: FOR TESTING AND DEVELOPMENT ONLY - NOT FOR PRODUCTION USE
 *
 * This file provides simple file-based storage for wallet key shares.
 * It is intended ONLY for local development and testing purposes.
 *
 * DO NOT USE IN PRODUCTION because:
 * - Key shares are stored unencrypted in a local JSON file
 * - No access control or security measures are implemented
 * - File permissions are not managed
 * - No backup or recovery mechanisms
 *
 * For production environments, you should:
 * - Use a secure key management service (AWS KMS, HashiCorp Vault, etc.)
 * - Encrypt key shares at rest
 * - Implement proper access controls and audit logging
 * - Use a secure database with encryption
 * - Follow your organization's security best practices
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Local file storage - FOR TESTING ONLY
const WALLET_FILE = join(process.cwd(), ".wallets.json");

export interface StoredWallet {
  address: string;
  externalServerKeyShares: string[];
  createdAt: string;
}

export interface WalletStorage {
  [address: string]: StoredWallet;
}

/**
 * Load all saved wallets from local storage
 * ⚠️ FOR TESTING ONLY - Use secure storage in production
 */
export function loadWallets(): WalletStorage {
  if (!existsSync(WALLET_FILE)) return {};

  try {
    const data = readFileSync(WALLET_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.warn("Failed to load wallets file:", error);
    return {};
  }
}

/**
 * Save a wallet to local storage
 * ⚠️ FOR TESTING ONLY - Use secure storage in production
 */
export function saveWallet(wallet: StoredWallet): void {
  const wallets = loadWallets();
  wallets[wallet.address] = wallet;

  writeFileSync(WALLET_FILE, JSON.stringify(wallets, null, 2));
  console.info(`💾 Wallet saved to ${WALLET_FILE}`);
}

/**
 * Get a specific wallet by address
 * ⚠️ FOR TESTING ONLY - Use secure storage in production
 */
export function getWallet(address: string): StoredWallet | undefined {
  const wallets = loadWallets();
  return wallets[address];
}

/**
 * List all saved wallets
 * ⚠️ FOR TESTING ONLY - Use secure storage in production
 */
export function listWallets(): StoredWallet[] {
  const wallets = loadWallets();
  return Object.values(wallets);
}

/**
 * Delete a wallet from local storage
 * ⚠️ FOR TESTING ONLY - Use secure storage in production
 */
export function deleteWallet(address: string): boolean {
  const wallets = loadWallets();

  if (!wallets[address]) return false;

  delete wallets[address];
  writeFileSync(WALLET_FILE, JSON.stringify(wallets, null, 2));
  console.info(`🗑️  Wallet ${address} deleted`);
  return true;
}
