import { ThresholdSignatureScheme } from "@dynamic-labs-wallet/node";
import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";

import { getWallet } from "./wallet-storage";

export interface WalletInfo {
  address: string;
  externalServerKeyShares: string[];
}

/**
 * Get an existing wallet from storage or create a new ephemeral wallet
 *
 * @param dynamicEvmClient - Authenticated Dynamic EVM client
 * @param addressArg - Optional wallet address to load from storage
 * @param password - Optional password for wallet creation or backup recovery
 * @returns Wallet address and key shares
 */
export async function getOrCreateWallet(
  dynamicEvmClient: DynamicEvmWalletClient,
  addressArg?: string,
  password?: string,
): Promise<WalletInfo> {
  // If address provided, load from storage
  if (addressArg) {
    console.info(`Looking up wallet: ${addressArg}`);
    const stored = getWallet(addressArg);

    if (!stored) {
      console.error(`Wallet not found: ${addressArg}`);
      console.error(`Tip: Use "pnpm wallet --list" to see saved wallets`);
      process.exit(1);
    }

    // If key shares are stored locally, use them directly
    if (stored.externalServerKeyShares.length > 0) {
      console.info(`Loaded wallet from storage`);
      return {
        address: stored.address,
        externalServerKeyShares: stored.externalServerKeyShares,
      };
    }

    // Key shares were backed up to Dynamic — password required at sign time
    // The SDK will automatically recover shares when signMessage/signTransaction
    // is called with an empty externalServerKeyShares array and a password
    if (!password) {
      console.error(
        `This wallet's key shares are backed up to Dynamic. Provide --password to recover them.`,
      );
      process.exit(1);
    }

    console.info(
      `Loaded wallet from storage (shares will be recovered from backup)`,
    );
    return {
      address: stored.address,
      externalServerKeyShares: [],
    };
  }

  // Create new ephemeral wallet
  console.info(`Creating new wallet...`);
  const wallet = await dynamicEvmClient.createWalletAccount({
    thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
    backUpToClientShareService: false,
    ...(password && { password }),
  });

  console.info(`Wallet created: ${wallet.accountAddress}`);

  return {
    address: wallet.accountAddress,
    externalServerKeyShares: wallet.externalServerKeyShares,
  };
}
