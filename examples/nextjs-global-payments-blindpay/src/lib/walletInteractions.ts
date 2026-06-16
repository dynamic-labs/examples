import { parseUnits } from "viem";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { USDB_ABI } from "@/lib/abis/usdb";
import { config as wagmiConfig } from "@/lib/wagmi";
import { config } from "@/lib/config";

/**
 * Approve USDB tokens for transfer
 */
export async function approveUSDBTokens(
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

    // Execute the approval transaction using the contract address from quote
    const hash = await writeContract(wagmiConfig, {
      address: contractAddress as `0x${string}`,
      abi: USDB_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, BigInt(amount)],
    });

    // Wait for transaction confirmation
    await waitForTransactionReceipt(wagmiConfig, {
      hash,
    });

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
  amount: number,
  toAddress: string
): Promise<string> {
  try {
    // Convert amount to proper decimals
    const amountInTokens = parseUnits(amount.toString(), 6);

    // Execute the transfer transaction
    const hash = await writeContract(wagmiConfig, {
      address: config.contracts.usdb,
      abi: USDB_ABI,
      functionName: "transfer",
      args: [toAddress as `0x${string}`, amountInTokens],
    });

    // Wait for transaction confirmation
    await waitForTransactionReceipt(wagmiConfig, {
      hash,
    });

    return hash;
  } catch (error) {
    throw new Error(
      `Failed to transfer tokens: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
