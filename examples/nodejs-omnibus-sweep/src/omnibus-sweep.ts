#!/usr/bin/env tsx

/**
 * Dynamic Gasless Transaction Demo - Omnibus Sweep
 *
 * This demo showcases Dynamic's server-side wallet management capabilities
 * for financial institutions. It demonstrates:
 *
 * 1. Programmatic creation of customer wallets using Dynamic's API
 * 2. Gasless USDC token operations
 * 3. Omnibus account structure for fund aggregation
 * 4. Scalable concurrent transaction processing
 *
 * Business Use Case:
 * You can use this pattern to manage customer funds in a compliant,
 * gas-efficient manner where individual customer wallets hold funds
 * that can be swept to centralized omnibus accounts for settlement.
 *
 * Usage: tsx omnibus-sweep.ts [number_of_wallets]
 * Example: tsx omnibus-sweep.ts 10
 */

import { ThresholdSignatureScheme } from "@dynamic-labs-wallet/node";
import { encodeFunctionData, Hex, LocalAccount } from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACTS, TOKEN_ABI } from "../constants";
import { authenticatedEvmClient } from "./libs/dynamic";
import { getAuthorization, getSmartAccountClient } from "./libs/pimlico";
import { getWalletClient, getPublicClient } from "./libs/viem";
import {
  formatAddress,
  getTransactionLink,
  getAddressLink,
  dollarsToTokenUnits,
} from "./utils";
import pLimit from "p-limit";

interface SendTransactionParams {
  walletClient: LocalAccount;
  to: `0x${string}`;
  data: Hex;
}

const USDC_ADDRESS = CONTRACTS[baseSepolia.id].USDC;

// Concurrency limits to manage API rate limits and demo performance
// Dynamic wallet creation is rate-limited, so we use sequential processing
const WALLET_CREATION_LIMIT = pLimit(1);
// Transaction processing can be more concurrent for better performance
const TRANSACTION_LIMIT = pLimit(10);

// Parse command line arguments
const numWalletsArg = process.argv[2];

// Demo configuration constants
const DEFAULT_NUM_WALLETS = 5;
const MAX_USDC_AMOUNT = 1000; // Maximum USDC amount per wallet
const USDC_DECIMALS = 6; // USDC has 6 decimals
const TRANSACTION_CONFIRMATIONS = 2;

// Configuration with defaults
const NUM_WALLETS = numWalletsArg
  ? parseInt(numWalletsArg)
  : DEFAULT_NUM_WALLETS;
// Validate inputs
if (isNaN(NUM_WALLETS) || NUM_WALLETS <= 0) {
  console.error(
    "Error: Please provide a positive integer for the number of customer wallets to create"
  );
  console.error("Usage: tsx omnibus-sweep.ts [num_wallets]");
  console.error("Example: tsx omnibus-sweep.ts 10");
  process.exit(1);
}

/**
 * Creates a new Dynamic wallet account with 2-of-2 threshold signatures.
 * This ensures that transactions require both server-side and client-side approval,
 * providing enhanced security for financial applications.
 */
async function createWalletAccount(): Promise<DynamicWalletAccount> {
  const dynamicEvmClient = await authenticatedEvmClient();

  return await dynamicEvmClient.createWalletAccount({
    thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
    backUpToClientShareService: false,
  });
}

/**
 * Creates a wallet client for a customer wallet with the necessary Dynamic configuration.
 * This encapsulates the common wallet client setup logic used across multiple functions.
 */
async function createWalletClientForCustomer(
  customerWallet: CustomerWallet
): Promise<LocalAccount> {
  const dynamicEvmClient = await authenticatedEvmClient();
  return getWalletClient({
    dynamicEvmClient,
    address: customerWallet.wallet.accountAddress,
    externalServerKeyShares: customerWallet.wallet.externalServerKeyShares,
    chain: baseSepolia,
  });
}

/**
 * Sends a gasless transaction using Pimlico's paymaster service and waits for confirmation.
 * This demonstrates how to execute transactions without requiring customers to hold ETH.
 */
async function sendTransactionAndWait({
  walletClient,
  to,
  data,
}: SendTransactionParams): Promise<string> {
  const publicClient = getPublicClient({ chain: baseSepolia });
  const smartAccount = await getSmartAccountClient(baseSepolia, walletClient);
  const authorization = await getAuthorization(baseSepolia, walletClient);

  const hash = await smartAccount.sendTransaction({ to, data, authorization });
  await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: TRANSACTION_CONFIRMATIONS,
  });
  return hash;
}

/** Represents a Dynamic wallet account returned from createWalletAccount */
interface DynamicWalletAccount {
  accountAddress: string;
  externalServerKeyShares: string[];
}

/** Represents a customer wallet with its associated metadata for the demo */
interface CustomerWallet {
  index: number;
  wallet: DynamicWalletAccount;
  address: string;
  usdcAmount: bigint;
}

/**
 * Creates a customer wallet account and assigns it a random USDC amount for the demo.
 * This encapsulates the wallet creation logic and amount assignment in a single function.
 */
async function createCustomerWallet(index: number): Promise<CustomerWallet> {
  const walletNumber = index + 1;
  const customerWallet = await createWalletAccount();
  const walletAddress = formatAddress(customerWallet.accountAddress);
  console.info(`Customer wallet ${walletNumber} created: ${walletAddress}`);

  // Generate random USDC amount up to MAX_USDC_AMOUNT
  const usdcAmount = BigInt(Math.floor(Math.random() * MAX_USDC_AMOUNT) + 1);

  return {
    index: walletNumber,
    wallet: customerWallet,
    address: customerWallet.accountAddress,
    usdcAmount,
  };
}

/**
 * Funds a customer wallet by minting the specified amount of USDC tokens.
 * This simulates depositing funds into a customer account.
 */
async function fundCustomerWallet(
  customerWallet: CustomerWallet
): Promise<void> {
  const walletClient = await createWalletClientForCustomer(customerWallet);

  // Mint USDC to customer wallet
  const txHash = await sendTransactionAndWait({
    walletClient,
    to: USDC_ADDRESS,
    data: encodeFunctionData({
      abi: TOKEN_ABI,
      functionName: "mint",
      args: [customerWallet.usdcAmount],
    }),
  });
  console.info(
    `Funded customer wallet ${customerWallet.index} (${formatAddress(
      customerWallet.address
    )}): ${customerWallet.usdcAmount} USDC - ${getTransactionLink(txHash)}`
  );
}

/**
 * Transfers all USDC tokens from a customer wallet to the omnibus account.
 * This demonstrates the fund aggregation pattern used in financial institutions.
 */
async function sweepToOmnibus(
  customerWallet: CustomerWallet,
  omnibus: `0x${string}`
): Promise<bigint> {
  const walletClient = await createWalletClientForCustomer(customerWallet);
  const tokenUnits = dollarsToTokenUnits(
    customerWallet.usdcAmount,
    USDC_DECIMALS
  );

  // Transfer USDC from customer wallet to omnibus account
  const txHash = await sendTransactionAndWait({
    walletClient,
    to: USDC_ADDRESS,
    data: encodeFunctionData({
      abi: TOKEN_ABI,
      functionName: "transfer",
      args: [omnibus, tokenUnits],
    }),
  });
  console.info(
    `Swept customer wallet ${customerWallet.index} (${formatAddress(
      customerWallet.address
    )}): ${customerWallet.usdcAmount} USDC to omnibus - ${getTransactionLink(
      txHash
    )}`
  );

  return customerWallet.usdcAmount;
}

/**
 * Main demo execution flow:
 * 1. Create omnibus wallet for fund aggregation
 * 2. Create multiple customer wallets with random USDC amounts
 * 3. Fund each customer wallet with USDC tokens
 * 4. Sweep all funds from customer wallets to omnibus account
 * 5. Report total aggregated amount
 */
async function main() {
  console.info("Dynamic Gasless Transaction Demo - Omnibus Sweep");
  console.info(
    "Demonstrating scalable wallet management and gasless transfers"
  );
  console.info("=".repeat(60));
  console.info(
    `Configuration: ${NUM_WALLETS} wallets, funding random USDC amounts up to ${MAX_USDC_AMOUNT}`
  );
  console.info("=".repeat(60));

  console.info("Creating omnibus wallet for fund aggregation...");
  const omnibusWallet = await createWalletAccount();
  const omnibusAddress = omnibusWallet.accountAddress;
  const omnibusAddressFormatted = formatAddress(omnibusAddress);
  console.info(`Omnibus wallet created: ${omnibusAddressFormatted}`);
  console.info("");

  console.info(`Creating ${NUM_WALLETS} customer wallets...`);
  const walletCreationPromises = Array.from(
    { length: NUM_WALLETS },
    (_, index) => WALLET_CREATION_LIMIT(() => createCustomerWallet(index))
  );
  const customerWallets = await Promise.all(walletCreationPromises);
  console.info("");

  console.info(`Funding ${NUM_WALLETS} customer wallets with USDC tokens...`);
  const fundingPromises = customerWallets.map((customerWallet) =>
    TRANSACTION_LIMIT(() => fundCustomerWallet(customerWallet))
  );
  await Promise.all(fundingPromises);
  console.info("");

  console.info(
    `Sweeping funds from ${NUM_WALLETS} customer wallets to omnibus account...`
  );
  const sweepPromises = customerWallets.map((customerWallet) =>
    TRANSACTION_LIMIT(() =>
      sweepToOmnibus(customerWallet, omnibusAddress as `0x${string}`)
    )
  );
  const usdcAmounts = await Promise.all(sweepPromises);

  const totalTransferred = usdcAmounts.reduce(
    (sum: bigint, amount: bigint) => sum + amount,
    0n
  );
  console.info("");
  console.info("=".repeat(60));
  console.info(`Demo completed successfully.`);
  console.info(`Total USDC transferred: ${totalTransferred} USDC`);
  console.info(
    `Omnibus wallet address: ${omnibusAddressFormatted} - ${getAddressLink(
      omnibusAddress
    )}#tokentxns`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
