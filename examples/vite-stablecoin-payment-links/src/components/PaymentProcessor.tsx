import { useEffect, useState } from "react";
import { useUser, useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";
import { baseSepolia } from "viem/chains";
import { parseUnits, erc20Abi } from "viem";
import "./PaymentProcessor.css";

interface Props {
  isDarkMode: boolean;
}

interface PaymentData {
  recipient: string;
  amount: string;
  token: string;
  network: number;
  description: string | null;
  reference: string | null;
  timestamp: number | null;
}

export default function PaymentProcessor({ isDarkMode }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const user = useUser();
  const { walletAccounts } = useWalletAccounts();
  const evmWallet = walletAccounts?.find(isEvmWalletAccount);

  // Extract payment parameters from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipient = urlParams.get("recipient");
    const amount = urlParams.get("amount");
    const token = urlParams.get("token") || "USDC";
    const network = urlParams.get("network") || "84532"; // Default to Base Sepolia
    const description = urlParams.get("description");
    const reference = urlParams.get("reference");
    const timestamp = urlParams.get("timestamp");

    if (recipient && amount) {
      setPaymentData({
        recipient,
        amount,
        token,
        network: parseInt(network),
        description,
        reference,
        timestamp: timestamp ? parseInt(timestamp) : null,
      });
    }
  }, []);

  const handlePayment = async () => {
    if (!paymentData) {
      setError("Invalid payment data");
      return;
    }

    // Check if user is authenticated
    if (!user) {
      setError("Please log in to complete this payment");
      return;
    }

    if (!evmWallet) {
      setError("Wallet not connected or not EVM compatible");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get wallet client for Base Sepolia
      // Embedded wallets handle network configuration via the Dynamic dashboard
      const walletClient = await createWalletClientForWalletAccount({
        walletAccount: evmWallet,
        chain: baseSepolia,
      });

      // Use Base Sepolia USDC contract address
      const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

      // Convert amount to USDC units (6 decimals)
      const amountInUnits = parseUnits(paymentData.amount, 6);

      // Send USDC transfer
      const hash = await walletClient.writeContract({
        address: usdcAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [paymentData.recipient as `0x${string}`, amountInUnits],
      });

      setSuccess(true);
      console.log("USDC transfer successful:", hash);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  const clearPayment = () => {
    // Remove payment parameters from URL
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url.toString());

    setPaymentData(null);
    setError(null);
    setSuccess(false);
  };

  // Don't render anything if there's no payment data
  if (!paymentData) {
    return null;
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div
        className="payment-processor"
        data-theme={isDarkMode ? "dark" : "light"}
      >
        <div className="processor-container">
          <div className="auth-required">
            <h2>Authentication Required</h2>
            <p>You need to log in to complete this payment.</p>

            <div className="payment-summary">
              <h3>Payment Details:</h3>
              <p>
                <strong>Amount:</strong> {paymentData.amount}{" "}
                {paymentData.token}
              </p>
              <p>
                <strong>Recipient:</strong>{" "}
                {paymentData.recipient.substring(0, 8)}...
                {paymentData.recipient.substring(
                  paymentData.recipient.length - 6
                )}
              </p>
              <p>
                <strong>Network:</strong> Base Sepolia Testnet
              </p>
              {paymentData.description && (
                <p>
                  <strong>Description:</strong> {paymentData.description}
                </p>
              )}
              {paymentData.reference && (
                <p>
                  <strong>Reference:</strong> {paymentData.reference}
                </p>
              )}
            </div>

            <div className="auth-notice">
              <p>Please connect your wallet to continue with the payment.</p>
              <p>
                Once you log in, you'll be able to complete the payment
                securely.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="payment-processor"
        data-theme={isDarkMode ? "dark" : "light"}
      >
        <div className="processor-container">
          <div className="success-message">
            <h2>Payment Successful!</h2>
            <p>
              You have successfully sent {paymentData.amount}{" "}
              {paymentData.token} to {paymentData.recipient.substring(0, 8)}...
            </p>
            <button className="btn btn-primary" onClick={clearPayment}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="payment-processor"
      data-theme={isDarkMode ? "dark" : "light"}
    >
      <div className="processor-container">
        <h2>Complete Payment</h2>

        <div className="payment-summary">
          <h3>Payment Details:</h3>
          <p>
            <strong>Amount:</strong> {paymentData.amount} {paymentData.token}
          </p>
          <p>
            <strong>Recipient:</strong> {paymentData.recipient.substring(0, 8)}
            ...
            {paymentData.recipient.substring(paymentData.recipient.length - 6)}
          </p>
          <p>
            <strong>Network:</strong> Base Sepolia Testnet
          </p>
          {paymentData.description && (
            <p>
              <strong>Description:</strong> {paymentData.description}
            </p>
          )}
          {paymentData.reference && (
            <p>
              <strong>Reference:</strong> {paymentData.reference}
            </p>
          )}
        </div>

        {isLoading && <p className="loading-message">Processing payment...</p>}
        {error && <p className="error-message">Error: {error}</p>}

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Pay Now"}
          </button>

          <button
            className="btn btn-secondary"
            onClick={clearPayment}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
