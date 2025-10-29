#!/usr/bin/env tsx

/**
 * Dynamic Transaction Demo
 *
 * Send transactions with different gas sponsorship providers.
 *
 * Usage:
 *   pnpm send-txn standard                                # Create new wallet, user pays gas
 *   pnpm send-txn zerodev                                 # Create new wallet, ZeroDev sponsorship
 *   pnpm send-txn pimlico                                 # Create new wallet, Pimlico sponsorship
 *   pnpm send-txn zerodev --address 0x123...              # Use saved wallet
 *   pnpm send-txn zerodev --address 0x123... --password   # Use password-protected wallet
 */

import { createWalletClient, http, zeroAddress } from "viem";
import { baseSepolia } from "viem/chains";

import { authenticatedEvmClient, smartAccountClient } from "./libs/dynamic";
import { getAuthorization, getSmartAccountClient } from "./libs/pimlico";
import { getTransactionLink } from "./libs/utils";
import { getWalletClient } from "./libs/viem";
import { getOrCreateWallet, type WalletInfo } from "./libs/wallet-helpers";

type GasProvider = "standard" | "zerodev" | "pimlico";

async function sendTransactionStandard(wallet: WalletInfo, password?: string) {
  const dynamicEvmClient = await authenticatedEvmClient();

  const account = getWalletClient({
    dynamicEvmClient,
    address: wallet.address,
    externalServerKeyShares: wallet.externalServerKeyShares,
    password,
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  console.info(`Sending standard transaction (user pays gas)...`);
  const hash = await walletClient.sendTransaction({
    to: zeroAddress,
    value: 0n,
  });

  return hash;
}

async function sendTransactionZerodev(wallet: WalletInfo, password?: string) {
  const dynamicEvmClient = await authenticatedEvmClient();

  console.info(`Creating ZeroDev smart account...`);
  const smartAccount = await smartAccountClient({
    evmClient: dynamicEvmClient,
    networkId: "84532",
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

async function sendTransactionPimlico(wallet: WalletInfo, password?: string) {
  const dynamicEvmClient = await authenticatedEvmClient();

  const account = getWalletClient({
    dynamicEvmClient,
    address: wallet.address,
    externalServerKeyShares: wallet.externalServerKeyShares,
    password,
  });

  console.info(`Creating Pimlico smart account...`);
  const [smartAccountClient, authorization] = await Promise.all([
    getSmartAccountClient(baseSepolia, account),
    getAuthorization(baseSepolia, account),
  ]);

  console.info(`Sending gasless transaction (Pimlico)...`);
  const hash = await smartAccountClient.sendTransaction({
    to: zeroAddress,
    ...(authorization && { authorization }),
  });

  return hash;
}

async function main() {
  const args = process.argv.slice(2);
  const provider = (args[0] || "standard") as GasProvider;

  // Parse --address flag
  const addressIndex = args.indexOf("--address");
  const address = addressIndex !== -1 ? args[addressIndex + 1] : undefined;

  // Parse --password flag
  const passwordIndex = args.indexOf("--password");
  const password = passwordIndex !== -1 ? args[passwordIndex + 1] : undefined;

  const validProviders: GasProvider[] = ["standard", "zerodev", "pimlico"];
  if (!validProviders.includes(provider)) {
    console.error(`❌ Invalid provider: ${provider}`);
    console.error(`✅ Valid providers: ${validProviders.join(", ")}`);
    process.exit(1);
  }

  try {
    const dynamicEvmClient = await authenticatedEvmClient();
    const wallet = await getOrCreateWallet(dynamicEvmClient, address, password);

    const start = Date.now();
    let hash: string;

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

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.info(`\n✅ Transaction sent in ${duration}s`);
    console.info(`📝 Hash: ${hash}`);
    console.info(`🔗 Explorer: ${getTransactionLink(hash)}`);
    console.info(`💳 Provider: ${provider}`);
    console.info(`👛 Wallet: ${wallet.address}`);

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
