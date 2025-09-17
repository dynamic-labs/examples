"use client";

import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

import { generateSessionId } from "@/lib/rain/utils/generate-session-id";
import { decryptSecret } from "@/lib/rain/utils/decrypt-secret";
import { CardEncryptedDataResponse } from "@/lib/rain/types";
import { getAuthToken } from "@/lib/dynamic";

interface CardDetailsProps {
  disabled?: boolean;
  onDetailsSuccess?: (cardNumber: string, cvv: string) => void;
  showDecryptedData?: boolean;
  onToggleVisibility?: () => void;
}

export default function CardDetails({
  disabled,
  onDetailsSuccess,
  showDecryptedData,
  onToggleVisibility,
}: CardDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleViewDetails = async () => {
    const authToken = getAuthToken();
    if (!authToken) {
      setError("Authentication required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Step 1: Generate session ID
      const { secretKey, sessionId } = await generateSessionId();

      // Step 2: Get encrypted card data from server API
      const response = await fetch("/api/card-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch card details");
      }

      const { encryptedData }: { encryptedData: CardEncryptedDataResponse } =
        await response.json();

      // Step 3: Decrypt the card details
      const decryptedCardNumber = await decryptSecret(
        encryptedData.encryptedPan.data,
        encryptedData.encryptedPan.iv,
        secretKey
      );

      const decryptedCvv = await decryptSecret(
        encryptedData.encryptedCvc.data,
        encryptedData.encryptedCvc.iv,
        secretKey
      );

      // Pass the decrypted data to the parent component
      onDetailsSuccess?.(decryptedCardNumber, decryptedCvv);
    } catch (error) {
      console.error("Failed to decrypt card details:", error);
      setError("Failed to retrieve card details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = () => {
    if (showDecryptedData) onToggleVisibility?.();
    else handleViewDetails();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-14 w-14 transition-all duration-200 ease-out hover:scale-110 hover:shadow-sm hover:shadow-primary/10 active:scale-105"
          onClick={handleToggleVisibility}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : showDecryptedData ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </Button>
        <span className="text-xs text-foreground">
          {showDecryptedData ? "Hide" : "Show"}
        </span>
      </div>

      {error && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setError("")}
          >
            Dismiss
          </Button>
        </div>
      )}
    </>
  );
}
