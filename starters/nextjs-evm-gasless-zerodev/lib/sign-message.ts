import { useState } from "react";

import { isEthereumWallet, useDynamicContext } from "@/lib/dynamic";

/**
 * Custom hook for signing messages with the connected wallet
 *
 * This hook provides functionality to sign arbitrary messages using
 * the user's connected Ethereum wallet.
 */
export function useSignMessage() {
  // Get the user's primary wallet from Dynamic's context
  const { primaryWallet } = useDynamicContext();

  // Track loading state during sign operations
  const [isLoading, setIsLoading] = useState(false);
  // Store the signature result after successful signing
  const [signature, setSignature] = useState<string | null>(null);

  /**
   * Signs a message with the connected wallet
   *
   * @param message - The message to sign
   * @returns Promise<string> - The signature of the message
   */
  const signMessage = async (message: string): Promise<string> => {
    // Validate message parameter
    if (!message) throw new Error("Message is required");

    try {
      // Set loading state to show user that operation is in progress
      setIsLoading(true);

      // Ensure we have a valid Ethereum wallet connected
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
        throw new Error("Wallet not connected or not EVM compatible");
      }

      // Sign the message using the connected wallet
      const result = await primaryWallet.signMessage(message);

      // Validate we received a signature
      if (!result) {
        throw new Error("Failed to sign message");
      }

      // Store the signature for UI display and return it
      setSignature(result);
      return result;
    } catch (e: unknown) {
      console.log("Signing failed:", e);
      throw e; // Re-throw to allow caller to handle the error
    } finally {
      // Always reset loading state, whether success or failure
      setIsLoading(false);
    }
  };

  /**
   * Resets the sign state to initial values
   * Useful for clearing previous signature data before new operations
   */
  const resetSign = () => {
    setSignature(null);
    setIsLoading(false);
  };

  // Return the hook's public API
  return {
    isPending: isLoading, // Whether a sign operation is currently in progress
    signature, // Signature of the last successful sign (null if none)
    signMessage, // Function to initiate message signing
    resetSign, // Function to reset the hook's state
  };
}
