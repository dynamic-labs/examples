#!/usr/bin/env tsx

/**
 * Delegated Wallet Gasless Transaction Demo
 *
 * Send a gasless transaction from a wallet a user has delegated to your app,
 * sponsored by Dynamic — no bundler, paymaster, or smart account involved.
 *
 * ## How this differs from a server wallet
 *
 * With a server wallet you hold the key shares, so the SDK's
 * `sendSponsoredTransaction` can sign the sponsorship intent for you.
 *
 * A delegated wallet's share stays with Dynamic behind a wallet-scoped API key,
 * so the intent has to be signed through the delegated signing path instead.
 * `src/lib/gasless/evm.ts` assembles the same EIP-712 intent the SDK builds
 * internally, signs it with the delegated credentials, then relays it with your
 * environment API token. The transaction still comes from the user's own
 * address — delegation changes who signs, not whose account it is.
 *
 * ## Prerequisites
 *
 * This script requires a wallet.json file with delegated access credentials.
 * See wallet.json.example for the required format.
 *
 * The delegated credentials arrive on your `wallet.delegation.created` webhook
 * when the user approves delegation in your frontend.
 *
 * Gas sponsorship must also be enabled for your environment: it is an
 * enterprise feature, toggled under Settings -> Embedded Wallets in the
 * Dynamic dashboard.
 *
 * ## Usage
 *
 *   pnpm evm:delegated:send-txn
 */

import { DEFAULT_CHAIN } from "../../../constants";
import { zeroAddress } from "viem";

import { parseArgs, runScript } from "../../lib/cli";
import { authenticatedEvmClient, delegatedEvmClient } from "../../lib/clients/evm";
import {
  sendDelegatedSponsoredTransaction,
  signDelegatedSponsoredTransaction,
} from "../../lib/gasless/evm";
import { getTransactionLink } from "../../lib/utils";
import { loadEvmDelegatedCredentials } from "./credentials";

/**
 * Step 1: Build clients and send the sponsored transaction
 *
 * Two clients are involved, and the split is the point:
 * - the delegated client signs, using the user's delegated credentials
 * - the API-token client relays, which needs no wallet key material at all
 */
async function sendTransaction() {
  // Signs on the user's behalf with the credentials they delegated
  const delegatedClient = delegatedEvmClient();

  // Looks up the relayer and submits the signed intent
  const evmClient = await authenticatedEvmClient();

  // Credentials come from your delegation webhook
  const credentials = loadEvmDelegatedCredentials();

  console.info(`\nSending gasless transaction (sponsored by Dynamic)...`);
  console.info(`Wallet: ${credentials.address}`);
  const start = Date.now();

  // Step 2: Sign the intent with delegated credentials and relay it.
  // On this wallet's first sponsored transaction the EIP-7702 delegation is
  // signed too, so expect it to take longer than subsequent ones.
  const { transactionHash } = await sendDelegatedSponsoredTransaction({
    evmClient,
    delegatedClient,
    credentials,
    chain: DEFAULT_CHAIN,
    calls: [{ target: zeroAddress, data: "0x", value: 0n }],
  });

  // Step 3: Display results
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.info(`\nTransaction sent in ${duration}s`);
  console.info(`Hash: ${transactionHash}`);
  console.info(`Explorer: ${getTransactionLink(transactionHash)}`);

  return transactionHash;
}

/**
 * Alternative: sign now, relay later.
 *
 * `signDelegatedSponsoredTransaction` stops after signing and hands back a plain
 * JSON payload. The two halves are genuinely separable — sign in a process that
 * can reach the delegated credentials, relay from one that only needs your
 * environment API token, at any point inside `validForSeconds`.
 *
 * This is the only route to that split for a delegated wallet. The SDK's own
 * `signSponsoredTransaction` signs with caller-held key shares, which a delegated
 * wallet by definition does not have.
 *
 * Both steps run here so the demo is self-contained; in production they would sit
 * in different processes, and the payload would travel between them as JSON.
 */
async function preSignThenRelay() {
  const delegatedClient = delegatedEvmClient();
  const evmClient = await authenticatedEvmClient();
  const credentials = loadEvmDelegatedCredentials();

  console.info(`\nStep 1: signing the intent (no relay yet)...`);
  const start = Date.now();

  const signedTransaction = await signDelegatedSponsoredTransaction({
    evmClient,
    delegatedClient,
    credentials,
    chain: DEFAULT_CHAIN,
    calls: [{ target: zeroAddress, data: "0x", value: 0n }],
  });

  console.info(`Signed in ${((Date.now() - start) / 1000).toFixed(2)}s`);
  console.info(`\nThe payload below is plain JSON — persist it, queue it, or send`);
  console.info(`it to another service. Nothing here holds key material:`);
  console.info(JSON.stringify(signedTransaction, null, 2));

  // Step 2: relay it. Only the environment API token is needed for this half.
  console.info(`\nStep 2: relaying the signed intent...`);
  const relayStart = Date.now();
  const { transactionHash } = await evmClient.sendSponsoredTransaction({
    signedTransaction,
  });

  console.info(`\nRelayed in ${((Date.now() - relayStart) / 1000).toFixed(2)}s`);
  console.info(`Hash: ${transactionHash}`);
  console.info(`Explorer: ${getTransactionLink(transactionHash)}`);

  return transactionHash;
}

runScript(async () => {
  const { hasFlag } = parseArgs(process.argv);

  if (hasFlag("pre-sign")) {
    await preSignThenRelay();
    return;
  }

  await sendTransaction();
});
