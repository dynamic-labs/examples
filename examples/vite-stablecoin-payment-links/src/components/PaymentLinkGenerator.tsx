import { useState } from "react";
import {
  useDynamicContext,
  DynamicConnectButton,
} from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import "./PaymentLinkGenerator.css";

export default function PaymentLinkGenerator({
  isDarkMode,
}: {
  isDarkMode: boolean;
}) {
  const [amount, setAmount] = useState("10");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [copied, setCopied] = useState(false);
  const { primaryWallet } = useDynamicContext();

  const generatePaymentLink = async () => {
    if (!primaryWallet?.address || !isEthereumWallet(primaryWallet)) {
      alert("Please connect an Ethereum wallet to generate payment links");
      return;
    }

    try {
      // Get current network
      const currentChainId = await primaryWallet.connector.getNetwork();

      // Create a payment link with preset parameters
      const baseUrl = window.location.origin;
      const params = new URLSearchParams({
        recipient: primaryWallet.address,
        amount: amount,
        token: "USDC",
        network: currentChainId?.toString() || "84532", // Default to Base Sepolia
        ...(description && { description }),
        ...(reference && { reference }),
        timestamp: Date.now().toString(),
      });

      const link = `${baseUrl}/pay?${params.toString()}`;
      setPaymentLink(link);
      setCopied(false);
    } catch (error) {
      console.error("Error generating payment link:", error);
      alert("Failed to generate payment link. Please try again.");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      alert("Failed to copy link to clipboard");
    }
  };

  const clearForm = () => {
    setAmount("10");
    setDescription("");
    setReference("");
    setPaymentLink("");
    setCopied(false);
  };

  return (
    <div
      className="payment-link-generator"
      data-theme={isDarkMode ? "dark" : "light"}
    >
      <div className="generator-container">
        <h3>Generate USDC Payment Link</h3>

        <div className="form-group">
          <label htmlFor="amount">Amount (USDC):</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            placeholder="Enter amount"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (Optional):</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Coffee payment"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="reference">Reference (Optional):</label>
          <input
            id="reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g., coffee-2024-01"
            className="form-input"
          />
        </div>

        <div className="button-group">
          {!primaryWallet ? (
            <DynamicConnectButton buttonClassName="btn btn-primary">
              Connect Wallet
            </DynamicConnectButton>
          ) : (
            <button
              className="btn btn-primary"
              onClick={generatePaymentLink}
              disabled={!isEthereumWallet(primaryWallet)}
            >
              Generate Payment Link
            </button>
          )}

          {paymentLink && (
            <button className="btn btn-secondary" onClick={clearForm}>
              Clear
            </button>
          )}
        </div>

        {paymentLink && (
          <div className="payment-link-container">
            <h4>Payment Link Generated:</h4>
            <div className="link-display">
              <input
                type="text"
                value={paymentLink}
                readOnly
                className="link-input"
              />
              <button
                className={`btn ${copied ? "btn-success" : "btn-primary"}`}
                onClick={copyToClipboard}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <div className="link-info">
              <p>
                <strong>Amount:</strong> {amount} USDC
              </p>
              {description && (
                <p>
                  <strong>Description:</strong> {description}
                </p>
              )}
              {reference && (
                <p>
                  <strong>Reference:</strong> {reference}
                </p>
              )}
              <p>
                <strong>Recipient:</strong>{" "}
                {primaryWallet?.address?.substring(0, 8)}...
                {primaryWallet?.address?.substring(
                  primaryWallet.address.length - 6
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
