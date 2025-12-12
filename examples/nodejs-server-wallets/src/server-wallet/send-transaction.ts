#!/usr/bin/env tsx

/**
 * Dynamic Transaction Demo
 *
 * Send transactions with different gas sponsorship providers.
 *
 * ## Usage
 *
 *   pnpm send-txn standard                                # Create new wallet, user pays gas
 *   pnpm send-txn zerodev                                 # Create new wallet, ZeroDev sponsorship
 *   pnpm send-txn pimlico                                 # Create new wallet, Pimlico sponsorship
 *   pnpm send-txn zerodev --address 0x123...              # Use saved wallet
 *   pnpm send-txn zerodev --address 0x123... --password   # Use password-protected wallet
 *
 * ## Gas Providers
 *
 * - **standard**: User pays gas fees from their wallet balance
 * - **zerodev**: ZeroDev paymaster sponsors gas (gasless for user)
 * - **pimlico**: Pimlico paymaster sponsors gas (gasless for user)
 */

import { createAccountAdapter } from "@dynamic-labs-wallet/node-evm";
import { type LocalAccount, zeroAddress } from "viem";

import { parseArgs, runScript } from "../lib/cli";
import { DEFAULT_CHAIN } from "../lib/config";
import { authenticatedEvmClient, smartAccountClient } from "../lib/dynamic";
import { getAuthorization, getSmartAccountClient } from "../lib/pimlico";
import { getTransactionLink } from "../lib/utils";
import { getOrCreateWallet, type WalletInfo } from "../lib/wallet-helpers";

type GasProvider = "standard" | "zerodev" | "pimlico";
const VALID_PROVIDERS: GasProvider[] = ["standard", "zerodev", "pimlico"];

/**
 * Step 2a: Send a standard transaction (user pays gas)
 */
async function sendTransactionStandard(wallet: WalletInfo, password?: string) {
  // Create Dynamic client and get wallet client directly from SDK
  const dynamicEvmClient = await authenticatedEvmClient();

  const walletClient = await dynamicEvmClient.getWalletClient({
    accountAddress: wallet.address,
    externalServerKeyShares: wallet.externalServerKeyShares,
    chain: DEFAULT_CHAIN,
    password,
  });

  console.info(`Sending standard transaction (user pays gas)...`);
  const hash = await walletClient.sendTransaction({
    to: zeroAddress,
    value: 0n,
  });

  return hash;
}

/**
 * Step 2b: Send a gasless transaction via ZeroDev
 */
async function sendTransactionZerodev(wallet: WalletInfo, password?: string) {
  const dynamicEvmClient = await authenticatedEvmClient();

  console.info(`Creating ZeroDev smart account...`);
  // ZeroDev wraps your wallet in a smart account with paymaster
  const smartAccount = await smartAccountClient({
    evmClient: dynamicEvmClient,
    networkId: String(DEFAULT_CHAIN.id),
    address: wallet.address as `0x${string}`,
    externalServerKeyShares: wallet.externalServerKeyShares,
    ...(password && { password }),
  });

  console.info(`Sending gasless transaction (ZeroDev)...`);
  const hash = await smartAccount.sendTransaction({
    to: zeroAddress,
  });

  return hash;
}

/**
 * Step 2c: Send a gasless transaction via Pimlico
 */
async function sendTransactionPimlico(wallet: WalletInfo, password?: string) {
  const dynamicEvmClient = await authenticatedEvmClient();

  // Use SDK's createAccountAdapter for viem-compatible account
  // Cast to LocalAccount since the SDK adapter implements all required signing methods
  const account = createAccountAdapter({
    evmClient: dynamicEvmClient,
    accountAddress: wallet.address as `0x${string}`,
    externalServerKeyShares: wallet.externalServerKeyShares,
    password,
  }) as LocalAccount;

  const publicClient = dynamicEvmClient.createViemPublicClient({
    chain: DEFAULT_CHAIN,
    rpcUrl: DEFAULT_CHAIN.rpcUrls.default.http[0],
  });

  console.info(`Creating Pimlico smart account...`);
  // Pimlico provides ERC-4337 infrastructure with paymaster support
  const [smartAccountClient, authorization] = await Promise.all([
    getSmartAccountClient(publicClient, account),
    getAuthorization(publicClient, account),
  ]);

  console.info(`Sending gasless transaction (Pimlico)...`);
  const hash = await smartAccountClient.sendTransaction({
    to: zeroAddress,
    ...(authorization && { authorization }),
  });

  return hash;
}

runScript(async () => {
  const { positional, getFlag } = parseArgs(process.argv);

  // Parse arguments
  const provider = (positional[0] || "standard") as GasProvider;
  const address = getFlag("address");
  const password = getFlag("password");

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider)) {
    console.error(`❌ Invalid provider: ${provider}`);
    console.error(`✅ Valid providers: ${VALID_PROVIDERS.join(", ")}`);
    process.exit(1);
  }

  // Step 1: Get or create wallet
  const dynamicEvmClient = await authenticatedEvmClient();
  const wallet = await getOrCreateWallet(dynamicEvmClient, address, password);

  const start = Date.now();
  let hash: string;

  // Step 2: Send transaction with selected provider
  switch (provider) {
    case "standard":
      hash = await sendTransactionStandard(wallet, password);
      break;
    case "zerodev":
      hash = await sendTransactionZerodev(wallet, password);
      break;
    case "pimlico":
      hash = await sendTransactionPimlico(wallet, password);
      break;
  }

  // Step 3: Display results
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.info(`\n✅ Transaction sent in ${duration}s`);
  console.info(`📝 Hash: ${hash}`);
  console.info(`🔗 Explorer: ${getTransactionLink(hash)}`);
  console.info(`💳 Provider: ${provider}`);
  console.info(`👛 Wallet: ${wallet.address}`);
});
