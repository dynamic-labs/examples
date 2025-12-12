#!/usr/bin/env tsx

/**
 * Dynamic Message Signing Demo
 *
 * Sign messages with Dynamic server wallets for authentication,
 * verification, and proof of ownership.
 *
 * ## Usage
 *
 *   pnpm sign-msg "Hello, World!"                                    # Sign with new ephemeral wallet
 *   pnpm sign-msg "Hello, World!" --address 0x123...                 # Sign with saved wallet
 *   pnpm sign-msg "Hello, World!" --address 0x123... --password xyz  # Sign with password-protected wallet
 *
 * ## Use Cases
 *
 * - Authenticate users by proving wallet ownership
 * - Sign authorization tokens or session data
 * - Verify identity without on-chain transactions
 * - Create off-chain signatures for gasless flows
 */

import { parseArgs, runScript } from "../lib/cli";
import { authenticatedEvmClient } from "../lib/dynamic";
import { getOrCreateWallet, type WalletInfo } from "../lib/wallet-helpers";

/**
 * Step 2: Sign a message with the wallet
 */
async function signMessage(
  message: string,
  wallet: WalletInfo,
  password?: string
) {
  // Get authenticated Dynamic client
  const dynamicEvmClient = await authenticatedEvmClient();

  console.info(`\nSigning message...`);
  const start = Date.now();

  // Sign the message using the wallet's key shares
  // If wallet was created with a password, it must be provided here
  const signature = await dynamicEvmClient.signMessage({
    accountAddress: wallet.address,
    externalServerKeyShares: wallet.externalServerKeyShares,
    message,
    ...(password && { password }),
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);

  // Step 3: Display results
  console.info(`\n✅ Message signed in ${duration}s`);
  console.info(`📝 Message: "${message}"`);
  console.info(`✍️ Signature: ${signature}`);
  console.info(`👛 Signer: ${wallet.address}`);

  return signature;
}

function showUsage(): never {
  console.error("❌ Please provide a message to sign");
  console.error("\nUsage:");
  console.error('  pnpm sign-msg "Hello, World!"');
  console.error('  pnpm sign-msg "Hello, World!" --address 0x123...');
  console.error(
    '  pnpm sign-msg "Hello, World!" --address 0x123... --password xyz'
  );
  process.exit(1);
}

runScript(async () => {
  const { positional, getFlag } = parseArgs(process.argv);

  // Parse arguments
  const message = positional[0];
  const address = getFlag("address");
  const password = getFlag("password");

  if (!message) {
    showUsage();
  }

  // Step 1: Get or create wallet
  const dynamicEvmClient = await authenticatedEvmClient();
  const wallet = await getOrCreateWallet(dynamicEvmClient, address, password);

  // Step 2: Sign the message
  await signMessage(message, wallet, password);
});
