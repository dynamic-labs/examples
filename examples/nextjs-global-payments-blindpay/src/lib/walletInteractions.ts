import { parseUnits, createPublicClient, http, type WalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { USDB_ABI } from "@/lib/abis/usdb";
import { config } from "@/lib/config";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

/**
 * Approve USDB tokens for transfer
 */
export async function approveUSDBTokens(
  walletClient: WalletClient,
  contractAddress: string,
  spenderAddress: string,
  amount: string
): Promise<string> {
  try {
    // Validate inputs
    if (!contractAddress || !spenderAddress || !amount) {
      throw new Error("Missing required parameters for token approval");
    }

    // Validate amount is a valid number
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error(`Invalid approval amount: ${amount}`);
    }

    const [account] = await walletClient.getAddresses();

    // Execute the approval transaction
    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: USDB_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, BigInt(amount)],
      account,
      chain: baseSepolia,
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    return hash;
  } catch (error) {
    throw new Error(
      `Failed to approve tokens: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Transfer USDB tokens to a specific address
 */
export async function transferUSDBTokens(
  walletClient: WalletClient,
  amount: number,
  toAddress: string
): Promise<string> {
  try {
    // Convert amount to proper decimals
    const amountInTokens = parseUnits(amount.toString(), 6);

    const [account] = await walletClient.getAddresses();

    // Execute the transfer transaction
    const hash = await walletClient.writeContract({
      address: config.contracts.usdb,
      abi: USDB_ABI,
      functionName: "transfer",
      args: [toAddress as `0x${string}`, amountInTokens],
      account,
      chain: baseSepolia,
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    return hash;
  } catch (error) {
    throw new Error(
      `Failed to transfer tokens: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
