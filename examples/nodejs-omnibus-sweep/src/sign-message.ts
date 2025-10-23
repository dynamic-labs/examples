#!/usr/bin/env tsx

/**
 * Dynamic Message Signing Demo
 *
 * Sign messages with Dynamic server wallets for authentication,
 * verification, and proof of ownership.
 *
 * ## Signing Messages
 *
 * Sign with a new ephemeral wallet:
 *   pnpm sign-msg "Hello, World!"
 *
 * Sign with a saved wallet:
 *   pnpm sign-msg "Hello, World!" --address 0x123...
 *
 * Sign with password-protected wallet:
 *   pnpm sign-msg "Hello, World!" --address 0x123... --password myPassword
 *
 * ## Use Cases
 *
 * - Authenticate users by proving wallet ownership
 * - Sign authorization tokens or session data
 * - Verify identity without on-chain transactions
 * - Create off-chain signatures for gasless flows
 */

import { authenticatedEvmClient } from "./libs/dynamic";
import { getOrCreateWallet, type WalletInfo } from "./libs/wallet-helpers";

async function signMessage(
  message: string,
  wallet: WalletInfo,
  password?: string
) {
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

  console.info(`\n✅ Message signed in ${duration}s`);
  console.info(`📝 Message: "${message}"`);
  console.info(`✍️ Signature: ${signature}`);
  console.info(`👛 Signer: ${wallet.address}`);

  return signature;
}

async function main() {
  const args = process.argv.slice(2);

  // First argument is the message to sign
  const message = args[0];

  if (!message) {
    console.error("❌ Please provide a message to sign");
    console.error("\nUsage:");
    console.error('  pnpm sign-msg "Hello, World!"');
    console.error('  pnpm sign-msg "Hello, World!" --address 0x123...');
    console.error(
      '  pnpm sign-msg "Hello, World!" --address 0x123... --password xyz'
    );
    process.exit(1);
  }

  // Parse --address flag
  const addressIndex = args.indexOf("--address");
  const address = addressIndex !== -1 ? args[addressIndex + 1] : undefined;

  // Parse --password flag
  const passwordIndex = args.indexOf("--password");
  const password = passwordIndex !== -1 ? args[passwordIndex + 1] : undefined;

  try {
    const dynamicEvmClient = await authenticatedEvmClient();
    const wallet = await getOrCreateWallet(dynamicEvmClient, address, password);

    await signMessage(message, wallet, password);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
