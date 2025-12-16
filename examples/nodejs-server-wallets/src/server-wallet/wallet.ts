#!/usr/bin/env tsx

/**
 * Dynamic Server Wallet Management
 *
 * Create and manage server-side wallets for automated operations like
 * omnibus payments, treasury management, and gasless transactions.
 *
 * ## Creating Wallets
 *
 * Create ephemeral wallets for one-time use:
 *   pnpm wallet --create
 *
 * Create and save wallets for reuse:
 *   pnpm wallet --create --save
 *
 * Create wallet with password protection:
 *   pnpm wallet --create --save --password mySecretPassword
 *
 * ## Managing Saved Wallets
 *
 * List all saved wallets:
 *   pnpm wallet --list
 *
 * Delete a saved wallet:
 *   pnpm wallet --delete 0x123...
 *
 * ## Using Wallets
 *
 * Created wallets can be used with other examples:
 *
 * send-transaction.ts - Send transactions with different gas providers:
 * - Standard transactions (user pays gas)
 * - Gasless transactions with ZeroDev
 * - Gasless transactions with Pimlico
 *
 * sign-message.ts - Sign messages for authentication and verification
 */

import { ThresholdSignatureScheme } from "@dynamic-labs-wallet/node";

import { parseArgs, runScript } from "../lib/cli";
import { authenticatedEvmClient } from "../lib/dynamic";
import { deleteWallet, listWallets, saveWallet } from "../lib/wallet-storage";

async function createWallet(shouldSave: boolean, password?: string) {
  // Step 1: Authenticate with Dynamic using your API token
  // This returns a client that can create and manage wallets
  const dynamicEvmClient = await authenticatedEvmClient();

  console.info(`Creating server wallet...`);
  const start = Date.now();

  // Step 2: Create a new server-side wallet
  // Returns: { accountAddress: string, externalServerKeyShares: string[] }
  //
  // Parameters:
  // - thresholdSignatureScheme: TWO_OF_TWO means both key shares are required to sign
  // - backUpToClientShareService: false keeps key shares local (not backed up to Dynamic)
  // - password: (Optional) Encrypts the key shares with a password for additional security
  const wallet = await dynamicEvmClient.createWalletAccount({
    thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
    backUpToClientShareService: true,
    ...(password && { password }),
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.info(`✅ Server wallet created in ${duration}s`);
  console.info(`📍 Address: ${wallet.accountAddress}`);
  if (password) console.info(`🔒 Password protection enabled`);

  if (shouldSave) {
    // Step 3 (Optional): Persist wallet to .wallets.json
    // You MUST save externalServerKeyShares to use this wallet for future transactions
    // Without the key shares, you cannot sign transactions with this address
    saveWallet({
      address: wallet.accountAddress,
      externalServerKeyShares: wallet.externalServerKeyShares,
      createdAt: new Date().toISOString(),
    });
  } else {
    console.info(`💡 Tip: Add '--save' flag to persist wallet for reuse`);
  }
}

function displayWalletList() {
  const wallets = listWallets();

  if (wallets.length === 0) {
    console.info("📭 No saved wallets found");
    console.info(
      "💡 Tip: Use 'pnpm wallet --create --save' to create a wallet"
    );
    return;
  }

  console.info(`📚 Saved wallets (${wallets.length}):\n`);
  wallets.forEach((w, i) => {
    console.info(`${i + 1}. ${w.address}`);
    console.info(`   Created: ${new Date(w.createdAt).toLocaleString()}`);
    console.info("");
  });
}

function removeWallet(address: string) {
  const success = deleteWallet(address);

  if (!success) {
    console.error(`❌ Wallet not found: ${address}`);
    console.info(`💡 Tip: Use 'pnpm wallet --list' to see saved wallets`);
    process.exit(1);
  }

  console.info(`✅ Wallet deleted successfully`);
}

function showUsage() {
  console.error("❌ Please specify an action:");
  console.error(
    "  pnpm wallet --create                        # Create wallet (ephemeral)"
  );
  console.error(
    "  pnpm wallet --create --save                 # Create and save wallet"
  );
  console.error(
    "  pnpm wallet --create --save --password xyz  # Create with password"
  );
  console.error(
    "  pnpm wallet --list                          # List saved wallets"
  );
  console.error(
    "  pnpm wallet --delete <address>              # Delete a saved wallet"
  );
  process.exit(1);
}

runScript(async () => {
  const { hasFlag, getFlag } = parseArgs(process.argv);

  const shouldCreate = hasFlag("create");
  const shouldList = hasFlag("list");
  const shouldSave = hasFlag("save");
  const shouldDelete = hasFlag("delete");
  const deleteAddress = getFlag("delete");
  const password = getFlag("password");

  if (!shouldCreate && !shouldList && !shouldDelete) {
    showUsage();
  }

  if (shouldDelete && !deleteAddress) {
    console.error("❌ Please provide an address to delete");
    console.error("  pnpm wallet --delete <address>");
    process.exit(1);
  }

  if (shouldList) {
    displayWalletList();
  } else if (shouldDelete && deleteAddress) {
    removeWallet(deleteAddress);
  } else if (shouldCreate) {
    await createWallet(shouldSave, password);
  }
});
