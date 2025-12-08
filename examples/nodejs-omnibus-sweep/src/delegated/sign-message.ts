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

import { delegatedEvmClient, delegatedSignMessage } from "../libs/dynamic";
import wallet from "./wallet.json";

async function signMessage(message: string) {
  const client = delegatedEvmClient();

  console.info(`\nSigning message...`);
  const start = Date.now();

  const signature = await delegatedSignMessage(client, {
    walletId: wallet.walletId,
    walletApiKey: wallet.walletApiKey,
    keyShare: wallet.delegatedShare,
    message,
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);

  console.info(`\n✅ Message signed in ${duration}s`);
  console.info(`📝 Message: "${message}"`);
  console.info(`✍️ Signature: ${signature}`);

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
    process.exit(1);
  }

  try {
    await signMessage(message);
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
