#!/usr/bin/env tsx

/**
 * Delegated Wallet Transaction Demo
 *
 * Send gasless transactions using a delegated wallet.
 *
 * ## Prerequisites
 *
 * This script requires a wallet.json file with delegated access credentials.
 * See wallet.json.example for the required format.
 *
 * The delegated share is obtained through a separate process where the user
 * grants your application permission to sign on their behalf.
 *
 * ## Usage
 *
 *   pnpm delegated:send-txn
 */

import {
  createDelegatedEvmWalletClient,
  createZerodevClient,
} from "@dynamic-labs-wallet/node-evm";
import { zeroAddress } from "viem";

import { DYNAMIC_API_TOKEN, DYNAMIC_ENVIRONMENT_ID } from "../../constants";
import { runScript } from "../lib/cli";
import { getTransactionLink } from "../lib/utils";
import wallet from "./wallet.json";

/**
 * Step 1: Create delegated client and send transaction
 *
 * Unlike server wallets where you control the key shares,
 * delegated wallets use credentials provided by the wallet owner.
 */
async function sendTransaction() {
  // Create a delegated client using your API credentials
  const client = createDelegatedEvmWalletClient({
    environmentId: DYNAMIC_ENVIRONMENT_ID,
    apiKey: DYNAMIC_API_TOKEN,
  });

  console.info(`\nSending transaction...`);
  const start = Date.now();

  // Create ZeroDev client for gasless transactions
  const zerodevClient = await createZerodevClient(client);

  // Create smart account with delegated access
  // This uses the wallet owner's delegated share to authorize signing
  const smartAccount = await zerodevClient.createKernelClientForAddress({
    withSponsorship: true,
    networkId: "11155111",
    address: wallet.address as `0x${string}`,
    delegated: {
      delegatedClient: client,
      walletId: wallet.walletId,
      walletApiKey: wallet.walletApiKey,
      keyShare: wallet.delegatedShare,
    },
  });

  // Step 2: Send the gasless transaction
  const hash = await smartAccount.sendTransaction({
    to: zeroAddress,
    value: BigInt(0),
  });

  // Step 3: Display results
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.info(`\n✅ Transaction sent in ${duration}s`);
  console.info(`📝 Hash: ${hash}`);
  console.info(`🔗 Explorer: ${getTransactionLink(hash)}`);

  return hash;
}

runScript(async () => {
  await sendTransaction();
});
