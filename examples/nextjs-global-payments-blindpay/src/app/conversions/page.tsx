"use client";

import ConversionCard from "@/components/ConversionCard";
import ConversionResultDisplay from "@/components/ConversionResultDisplay";
import SelectionModal from "@/components/SelectionModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { config } from "@/lib/config";
import { useDynamicContext } from "@/lib/dynamic";
import { useKYCStatus } from "@/lib/hooks/useKYCStatus";
import { usePaymentMethods } from "@/lib/hooks/usePaymentMethods";
import { useConversion } from "@/lib/hooks/useConversion";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConversionData } from "@/types";
import { redirect } from "next/navigation";

export default function ConversionsPage() {
  const { primaryWallet } = useDynamicContext();
  const { isConnected } = useAccount();
  const { receiverId, isKYCComplete, isLoading: kycLoading } = useKYCStatus();

  if (!isKYCComplete) redirect("/");

  const {
    hasPaymentMethods,
    hasBankAccounts,
    hasBlockchainWallets,
    availableBankAccounts,
    availableBlockchainWallets,
    checkPaymentMethods,
  } = usePaymentMethods(receiverId);

  const {
    isConverting,
    conversionResult,
    handleStableToFiatConversion,
    handleFiatToStableConversion,
    clearConversionResult,
  } = useConversion();

  // Modal state
  const [showBankSelection, setShowBankSelection] = useState(false);
  const [showWalletSelection, setShowWalletSelection] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [selectedBlockchainWalletId, setSelectedBlockchainWalletId] =
    useState("");
  const [pendingConversionData, setPendingConversionData] =
    useState<ConversionData | null>(null);

  const handleBankAccountSelection = async (bankAccountId: string) => {
    if (!pendingConversionData || !primaryWallet?.address) return;

    try {
      await handleStableToFiatConversion(
        pendingConversionData,
        bankAccountId,
        primaryWallet.address
      );
      setShowBankSelection(false);
      setPendingConversionData(null);
      setSelectedBankAccountId("");
    } catch (error) {
      alert(
        `Conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleBlockchainWalletSelection = async (
    blockchainWalletId: string
  ) => {
    if (!pendingConversionData || !receiverId) return;

    try {
      await handleFiatToStableConversion(
        pendingConversionData,
        blockchainWalletId,
        receiverId
      );
      setShowWalletSelection(false);
      setPendingConversionData(null);
      setSelectedBlockchainWalletId("");
    } catch (error) {
      alert(
        `Conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const startStableToFiatConversion = async (data: ConversionData) => {
    if (
      !isConnected ||
      !primaryWallet ||
      !isKYCComplete ||
      !receiverId ||
      !hasPaymentMethods
    ) {
      alert("Please complete setup first");
      return;
    }

    try {
      if (availableBankAccounts.length === 0) {
        await checkPaymentMethods();
      }

      if (availableBankAccounts.length === 0) {
        throw new Error(
          "No bank accounts found. Please add a bank account first."
        );
      }

      if (availableBankAccounts.length === 1) {
        // Auto-select if only one account
        await handleStableToFiatConversion(
          data,
          availableBankAccounts[0].id,
          primaryWallet.address
        );
      } else {
        // Show selection modal
        setPendingConversionData(data);
        setShowBankSelection(true);
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to start conversion"
      );
    }
  };

  const startFiatToStableConversion = async (data: ConversionData) => {
    if (
      !isConnected ||
      !primaryWallet ||
      !isKYCComplete ||
      !receiverId ||
      !hasPaymentMethods
    ) {
      alert("Please complete setup first");
      return;
    }

    try {
      if (availableBlockchainWallets.length === 0) {
        await checkPaymentMethods();
      }

      if (availableBlockchainWallets.length === 0) {
        throw new Error(
          "No blockchain wallets found. Please add a blockchain wallet first."
        );
      }

      if (availableBlockchainWallets.length === 1) {
        // Auto-select if only one wallet
        await handleFiatToStableConversion(
          data,
          availableBlockchainWallets[0].id,
          receiverId
        );
      } else {
        // Show selection modal
        setPendingConversionData(data);
        setShowWalletSelection(true);
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to start conversion"
      );
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>
                  Connect your wallet to start converting between stablecoins
                  and fiat currencies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click the &quot;Connect Wallet&quot; button in the top
                  navigation to get started.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (kycLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Checking KYC status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPaymentMethods) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Payment Methods Required</CardTitle>
                <CardDescription>
                  Please add at least one payment method to start converting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Go to the Payment Methods page to add bank accounts or
                  blockchain wallets.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Currency Conversions</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Convert between stablecoins and fiat currencies seamlessly with your
            Dynamic wallet
          </p>
        </div>

        {conversionResult && (
          <div className="mb-8">
            <ConversionResultDisplay
              conversionResult={conversionResult}
              onClose={clearConversionResult}
            />
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold mb-2">Available Conversions</h2>
          <p className="text-muted-foreground">
            {hasBankAccounts && hasBlockchainWallets
              ? "You can convert in both directions - stablecoins to fiat and fiat to stablecoins"
              : hasBankAccounts
              ? "You can convert stablecoins to fiat (offramp)"
              : "You can convert fiat to stablecoins (onramp)"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {hasBankAccounts && (
            <div className="flex justify-center">
              <ConversionCard
                title="Stablecoin to Fiat"
                fromCurrency="USDB"
                toCurrency="USD"
                fromOptions={config.currencies.stablecoins}
                toOptions={config.currencies.fiat}
                onConvert={startStableToFiatConversion}
                isLoading={isConverting}
              />
            </div>
          )}

          {hasBlockchainWallets && (
            <div className="flex justify-center">
              <ConversionCard
                title="Fiat to Stablecoin"
                fromCurrency="USD"
                toCurrency="USDB"
                fromOptions={config.currencies.fiat}
                toOptions={config.currencies.stablecoins}
                onConvert={startFiatToStableConversion}
                isLoading={isConverting}
              />
            </div>
          )}
        </div>
      </div>

      <SelectionModal
        isOpen={showBankSelection}
        onClose={() => {
          setShowBankSelection(false);
          setPendingConversionData(null);
          setSelectedBankAccountId("");
        }}
        title="Select Bank Account"
        description="Choose which bank account to use for this conversion:"
        type="bank"
        items={availableBankAccounts}
        selectedId={selectedBankAccountId}
        onSelect={setSelectedBankAccountId}
        onConfirm={() => {
          if (selectedBankAccountId && pendingConversionData) {
            handleBankAccountSelection(selectedBankAccountId);
          }
        }}
      />

      <SelectionModal
        isOpen={showWalletSelection}
        onClose={() => {
          setShowWalletSelection(false);
          setPendingConversionData(null);
          setSelectedBlockchainWalletId("");
        }}
        title="Select Blockchain Wallet"
        description="Choose which blockchain wallet to use for this conversion:"
        type="wallet"
        items={availableBlockchainWallets}
        selectedId={selectedBlockchainWalletId}
        onSelect={setSelectedBlockchainWalletId}
        onConfirm={() => {
          if (selectedBlockchainWalletId && pendingConversionData) {
            handleBlockchainWalletSelection(selectedBlockchainWalletId);
          }
        }}
      />
    </div>
  );
}
