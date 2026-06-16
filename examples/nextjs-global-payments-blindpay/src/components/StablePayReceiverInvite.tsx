"use client";

import { useState, useEffect } from "react";
import { useDynamicContext } from "@/lib/dynamic";
import { useKYCStatus } from "@/lib/hooks/useKYCStatus";
import { config } from "@/lib/config";

export default function StablePayReceiverInvite() {
  const { primaryWallet, user } = useDynamicContext();
  const {
    receiverId,
    isKYCComplete,
    storeReceiverId,
    checkReceiverExists,
    clearBothIds,
  } = useKYCStatus();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkExistingReceiver = async () => {
      if (user?.email && !receiverId) {
        const exists = await checkReceiverExists();
        if (exists) {
          try {
            const response = await fetch(
              `/api/receivers?email=${encodeURIComponent(user.email)}&limit=1`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.receivers && data.receivers.length > 0) {
                const existingReceiverId = data.receivers[0].id;
                await storeReceiverId(existingReceiverId);
              }
            }
          } catch {
            // no-op
          }
        }
      }
    };

    checkExistingReceiver();
  }, [user?.email, receiverId, checkReceiverExists, storeReceiverId]);

  const handleStartKYC = () => {
    const url = config.blindpay.kycUrl;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleClearKYC = async () => {
    if (
      confirm(
        "Are you sure you want to clear your KYC data? This will remove your receiver ID."
      )
    ) {
      setIsLoading(true);
      try {
        await clearBothIds();
      } catch {
        alert("Failed to clear KYC data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isKYCComplete && receiverId) {
    return (
      <div className="bg-card rounded-xl shadow-lg p-6 border">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-card-foreground mb-2">
            KYC Verification Complete!
          </h3>
          <p className="text-muted-foreground mb-4">
            Your account has been verified and you can now use the service
            services.
          </p>
          <div className="bg-muted p-3 rounded text-sm space-y-2">
            <p>
              <strong>Receiver ID:</strong> {receiverId}
            </p>
            <p className="text-muted-foreground mt-1">
              Your KYC verification is complete and stored in Dynamic user
              metadata.
            </p>
            <p className="text-primary font-medium">
              Next step: Add a bank account and blockchain wallet to start
              converting funds.
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={handleClearKYC}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground py-2 px-4 rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Clearing..." : "Clear KYC Data"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!primaryWallet) {
    return (
      <div className="bg-card rounded-xl shadow-lg p-6 border">
        <h3 className="text-xl font-semibold text-card-foreground mb-4">
          KYC Verification
        </h3>
        <p className="text-muted-foreground">
          Please connect your wallet to proceed with KYC verification.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 border">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
          <svg
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-card-foreground mb-2">
          KYC Verification Required
        </h3>
        <p className="text-muted-foreground mb-6">
          To use this service, you need to complete a Know Your Customer (KYC)
          verification. This is a secure, regulatory-compliant process that
          helps protect your account.
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-primary mb-2">
            What you&apos;ll need:
          </h4>
          <ul className="text-sm text-primary/80 space-y-1 text-left">
            <li>• Government-issued photo ID</li>
            <li>• Proof of address</li>
            <li>• Social Security Number or Tax ID</li>
            <li>• Basic personal information</li>
          </ul>
        </div>

        <button
          onClick={handleStartKYC}
          className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-colors duration-200"
        >
          Start KYC Verification
        </button>

        <p className="text-xs text-muted-foreground mt-3">
          Your information is encrypted and securely transmitted for for
          verification.
        </p>
      </div>
    </div>
  );
}
