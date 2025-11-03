#!/usr/bin/env tsx

/**
 * Dynamic Gasless Transaction Demo - Omnibus Sweep
 *
 * Demonstrates how to create and manage multiple server-side wallets
 * with gasless transactions for financial applications.
 *
 * ## What This Demo Does
 *
 * 1. Creates an omnibus wallet for fund aggregation
 * 2. Creates multiple customer wallets (default: 10)
 * 3. Funds each customer wallet with random USDC amounts
 * 4. Sweeps all funds to the omnibus wallet using gasless transactions
 * 5. Processes transactions concurrently for scalability
 *
 * ## Usage
 *
 * Run with default settings (10 wallets):
 *   pnpm omnibus
 *
 * Run with custom number of wallets:
 *   pnpm omnibus 20
 *
 * ## Use Case
 *
 * This pattern is ideal for financial institutions that need to:
 * - Manage individual customer wallets
 * - Aggregate funds to centralized omnibus accounts
 * - Execute transactions without customers holding ETH for gas
 * - Process operations at scale with concurrent transactions
 */

import { ThresholdSignatureScheme } from "@dynamic-labs-wallet/node";
import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import pLimit from "p-limit";
import { encodeFunctionData, type Hex, type LocalAccount } from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACTS, TOKEN_ABI } from "../constants";
import { authenticatedEvmClient } from "./libs/dynamic";
import { getAuthorization, getSmartAccountClient } from "./libs/pimlico";
import {
  dollarsToTokenUnits,
  formatAddress,
  getAddressLink,
  getTransactionLink,
} from "./libs/utils";
import { getPublicClient, getWalletClient } from "./libs/viem";

interface SendTransactionParams {
  walletClient: LocalAccount;
  to: `0x${string}`;
  data: Hex;
}

interface DynamicWalletAccount {
  accountAddress: string;
  externalServerKeyShares: string[];
}

interface CustomerWallet {
  index: number;
  wallet: DynamicWalletAccount;
  usdcAmount: bigint;
}

const USDC_ADDRESS = CONTRACTS[baseSepolia.id].USDC;

// Concurrency limits for API rate limiting
const WALLET_CREATION_LIMIT = pLimit(5);
const TRANSACTION_LIMIT = pLimit(25);

// Parse command line arguments
const numWalletsArg = process.argv[2];

// Demo configuration constants
const DEFAULT_NUM_WALLETS = 10;
const MAX_USDC_AMOUNT = 1000; // Maximum USDC amount per wallet
const USDC_DECIMALS = 6; // USDC has 6 decimals
const TRANSACTION_CONFIRMATIONS = 2;

// Configuration with defaults
const NUM_WALLETS = numWalletsArg
  ? parseInt(numWalletsArg, 10)
  : DEFAULT_NUM_WALLETS;
// Validate inputs
if (Number.isNaN(NUM_WALLETS) || NUM_WALLETS <= 0) {
  console.error(
    "Error: Please provide a positive integer for the number of customer wallets to create"
  );
  console.error("Usage: tsx omnibus-sweep.ts [num_wallets]");
  console.error("Example: tsx omnibus-sweep.ts 10");
  process.exit(1);
}

let dynamicEvmClient: DynamicEvmWalletClient;

/**
 * Creates a new Dynamic wallet account with retry logic and timeout handling.
 * Uses 2-of-2 threshold signatures for enhanced security.
 *
 * Note: This function includes retry logic specific to the omnibus demo.
 * For simpler wallet creation, see wallet.ts or wallet-helpers.ts
 */
async function createWalletAccount(
  walletNumber: number
): Promise<DynamicWalletAccount | null> {
  if (!dynamicEvmClient) dynamicEvmClient = await authenticatedEvmClient();

  // Create timeout promise to prevent hanging
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(new Error(`Wallet creation timeout for wallet ${walletNumber}`)),
      60000 // 60 second timeout
    )
  );

  // Create wallet with retry logic and exponential backoff
  const createWallet = async (): Promise<DynamicWalletAccount | null> => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        return await dynamicEvmClient?.createWalletAccount({
          thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
          backUpToClientShareService: false,
        });
      } catch (_error) {
        if (attempt === 5) break; // Don't delay after last attempt

        const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
        console.error(
          `Retrying to create wallet account ${walletNumber}. Attempt ${attempt}/5 in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.info(
      `Failed to create wallet account ${walletNumber} after 5 retries. Skipping...`
    );
    return null;
  };

  try {
    return await Promise.race([createWallet(), timeoutPromise]);
  } catch (error) {
    console.error(
      `Wallet creation timed out for wallet ${walletNumber}:`,
      error
    );
    return null;
  }
}

/**
 * Creates a wallet client for signing transactions from a customer wallet.
 * Uses the shared getWalletClient helper from libs/viem.ts
 */
async function createWalletClientForCustomer(
  customerWallet: CustomerWallet
): Promise<LocalAccount> {
  if (!dynamicEvmClient) dynamicEvmClient = await authenticatedEvmClient();

  return getWalletClient({
    dynamicEvmClient,
    address: customerWallet.wallet.accountAddress,
    externalServerKeyShares: customerWallet.wallet.externalServerKeyShares,
  });
}

/**
 * Sends a gasless transaction using Pimlico and waits for confirmation.
 * The paymaster sponsors gas so customers don't need ETH.
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

/**
 * Creates a customer wallet and assigns it a random USDC amount (1-1000).
 */
async function createCustomerWallet(
  index: number
): Promise<CustomerWallet | null> {
  const walletNumber = index + 1;
  const customerWallet = await createWalletAccount(index);
  if (!customerWallet) return null;

  console.info(
    `Customer wallet ${walletNumber} created: ${customerWallet.accountAddress}`
  );

  // Generate random USDC amount up to MAX_USDC_AMOUNT
  const usdcAmount = BigInt(Math.floor(Math.random() * MAX_USDC_AMOUNT) + 1);

  return {
    index: walletNumber,
    wallet: customerWallet,
    usdcAmount,
  };
}

/**
 * Funds a customer wallet by minting USDC tokens.
 * In production, this would be replaced with actual token transfers.
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
      customerWallet.wallet.accountAddress
    )}): ${customerWallet.usdcAmount} USDC - ${getTransactionLink(txHash)}`
  );
}

/**
 * Transfers USDC from a customer wallet to the omnibus account.
 * This is the core "sweep" operation that aggregates funds.
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
      customerWallet.wallet.accountAddress
    )}): ${customerWallet.usdcAmount} USDC to omnibus - ${getTransactionLink(
      txHash
    )}`
  );

  return customerWallet.usdcAmount;
}

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

  // Initialize the DynamicEvmWalletClient
  dynamicEvmClient = await authenticatedEvmClient();

  console.info("Creating omnibus wallet for fund aggregation...");
  const omnibusWallet = await createWalletAccount(0);
  if (!omnibusWallet) process.exit(1);

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
  const createdWallets = customerWallets.filter(
    (wallet): wallet is CustomerWallet => wallet !== null
  );
  const failedWallets = customerWallets.filter(
    (wallet) => wallet === null
  ).length;

  console.info(
    `Successfully created ${createdWallets.length} out of ${NUM_WALLETS} wallets (${failedWallets} failed)`
  );
  console.info("");

  console.info(
    `Funding ${createdWallets.length} customer wallets with USDC tokens...`
  );
  const fundingPromises = createdWallets.map((customerWallet) =>
    TRANSACTION_LIMIT(() => fundCustomerWallet(customerWallet))
  );
  await Promise.all(fundingPromises);
  console.info("");

  console.info(
    `Sweeping funds from ${createdWallets.length} customer wallets to omnibus account...`
  );
  const sweepPromises = createdWallets.map((customerWallet) =>
    TRANSACTION_LIMIT(() =>
      sweepToOmnibus(customerWallet, omnibusAddress as `0x${string}`)
    )
  );

  const usdcAmounts = await Promise.all(sweepPromises);

  const totalSwept = usdcAmounts.reduce((sum, amount) => sum + amount, 0n);

  console.info("");
  console.info("=".repeat(60));
  console.info(`Demo completed successfully.`);
  console.info(`Total USDC transferred: ${totalSwept} USDC`);
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
