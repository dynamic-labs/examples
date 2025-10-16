import { useState } from "react";

import {
  useDynamicContext,
  isEthereumWallet,
  isZeroDevConnector,
} from "@/lib/dynamic";
import { getContractAddress, TOKEN_ABI } from "../constants";

/**
 * Configuration options for minting tokens
 */
export interface MintOptions {
  amountDollars: number; // Amount in dollars to mint
  network: string | number; // Network identifier (chain ID or name)
}

/**
 * Custom hook for minting tokens using ZeroDev gasless transactions
 *
 * This hook provides functionality to mint ERC-20 tokens without requiring
 * users to pay gas fees, leveraging ZeroDev's account abstraction infrastructure.
 */
export function useMintTokens() {
  // Get the user's primary wallet from Dynamic's context
  const { primaryWallet } = useDynamicContext();

  // Track loading state during mint operations
  const [isLoading, setIsLoading] = useState(false);
  // Store the transaction hash after successful mint
  const [txHash, setTxHash] = useState<string | null>(null);

  /**
   * Mints tokens for the connected user using gasless transactions
   *
   * @param mintOptions - Configuration for the mint operation
   * @returns Promise<string> - The transaction hash of the successful mint
   */
  const mintTokens = async (mintOptions: MintOptions): Promise<string> => {
    // Validate network parameter
    if (!mintOptions.network) throw new Error("Network not found");

    // Get the token contract address for the specified network
    const tokenAddress = getContractAddress(mintOptions.network, "USD");
    if (!tokenAddress) throw new Error("Token address not found");

    const { amountDollars } = mintOptions;

    try {
      // Set loading state to show user that operation is in progress
      setIsLoading(true);

      // Ensure we have a valid Ethereum wallet connected
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
        throw new Error("Wallet not connected or not EVM compatible");
      }

      // Get the wallet client to interact with the blockchain
      const walletClient = await primaryWallet.getWalletClient();

      // Execute the mint function on the ERC-20 token contract
      // This creates a user operation that will be sponsored (gasless)
      const operationHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: TOKEN_ABI,
        functionName: "mint",
        args: [BigInt(amountDollars)], // Convert to BigInt for contract interaction
      });

      // Get the ZeroDev connector to access account abstraction features
      const connector = primaryWallet.connector;
      if (!connector || !isZeroDevConnector(connector)) {
        throw new Error("Connector is not a ZeroDev connector");
      }

      // Get the kernel client (ZeroDev's account abstraction provider)
      const kernelClient = connector.getAccountAbstractionProvider();
      if (!kernelClient) throw new Error("Kernel client not found");

      // Wait for the user operation to be processed and get the receipt
      // This is different from regular transactions as it's a user operation
      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: operationHash,
      });

      // Store the transaction hash for UI display and return it
      setTxHash(receipt.receipt.transactionHash);
      return receipt.receipt.transactionHash;
    } catch (e: unknown) {
      console.log("Transaction failed:", e);
      throw e; // Re-throw to allow caller to handle the error
    } finally {
      // Always reset loading state, whether success or failure
      setIsLoading(false);
    }
  };

  /**
   * Resets the mint state to initial values
   * Useful for clearing previous transaction data before new operations
   */
  const resetMint = () => {
    setTxHash(null);
    setIsLoading(false);
  };

  // Return the hook's public API
  return {
    isPending: isLoading, // Whether a mint operation is currently in progress
    txHash, // Transaction hash of the last successful mint (null if none)
    mintTokens, // Function to initiate token minting
    resetMint, // Function to reset the hook's state
  };
}
