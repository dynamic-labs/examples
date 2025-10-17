#!/usr/bin/env tsx

/**
 * Dynamic Basic Wallet Demo
 *
 * This demo showcases the fundamental Dynamic wallet creation and
 * gasless transaction capabilities. It demonstrates:
 *
 * 1. Server-side wallet account creation using Dynamic's API
 * 2. Wallet client configuration with threshold signatures
 * 3. Smart account setup with Pimlico for gasless transactions
 * 4. Basic transaction execution without gas fees
 *
 * Business Use Case:
 * This serves as a foundation for understanding Dynamic's wallet management
 * and gasless transaction infrastructure before implementing more complex
 * patterns like omnibus sweeps.
 *
 * Usage: pnpm create-wallet
 */

import { ThresholdSignatureScheme } from "@dynamic-labs-wallet/node";
import { zeroAddress } from "viem";
import { baseSepolia } from "viem/chains";

import { authenticatedEvmClient } from "./libs/dynamic";
import { getAuthorization, getSmartAccountClient } from "./libs/pimlico";
import { getWalletClient } from "./libs/viem";

/**
 * Main demo execution flow:
 * 1. Create a Dynamic wallet account with 2-of-2 threshold signatures
 * 2. Configure wallet client with the created account
 * 3. Set up smart account with Pimlico for gasless transactions
 * 4. Execute a basic transaction to demonstrate gasless capabilities
 */
async function main() {
  const dynamicEvmClient = await authenticatedEvmClient();
  const wallet = await dynamicEvmClient.createWalletAccount({
    thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
    backUpToClientShareService: false,
  });
  console.info(`Wallet created: ${wallet.accountAddress}`);

  const walletClient = getWalletClient({
    dynamicEvmClient,
    address: wallet.accountAddress,
    externalServerKeyShares: wallet.externalServerKeyShares,
  });

  const [smartAccount, authorization] = await Promise.all([
    getSmartAccountClient(baseSepolia, walletClient),
    getAuthorization(baseSepolia, walletClient),
  ]);

  const hash = await smartAccount.sendTransaction({
    to: zeroAddress,
    authorization,
  });

  console.info(`Transaction hash: ${hash}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
