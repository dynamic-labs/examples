"use client";

import { redirect } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Wallet2 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CreditCard } from "@/components/credit-cards";
import DynamicLogo from "@/components/dynamic/logo";
import { Button } from "@/components/ui/button";

import { useIsLoggedIn, useDynamicContext } from "@/lib/dynamic";
import { CreateCardForUserResponse } from "@/lib/rain/types";
import { Skeleton } from "../ui/skeleton";

import CardDetails from "./card-details";
import CardBalance from "./card-balance";
import FundCard from "./fund-card";
import CardTransactions from "./card-transactions";
import AccountModal from "../account/account-modal";
import StablecoinFaucet from "./stablecoin-faucet";
import { TokenBalanceProvider } from "./token-balance-context";

export default function DynamicCard() {
  const isLoggedIn = useIsLoggedIn();
  const { sdkHasLoaded, user } = useDynamicContext();

  const [hasMounted, setHasMounted] = useState(false);
  const [decryptedCardData, setDecryptedCardData] = useState<{
    cardNumber: string;
    cvv: string;
  } | null>(null);
  const [showDecryptedData, setShowDecryptedData] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const cardData = useMemo(() => {
    if (!hasMounted) return null;
    const metadata = user?.metadata as { rainCard?: CreateCardForUserResponse };
    if (!metadata?.rainCard) redirect("/");
    return metadata?.rainCard;
  }, [hasMounted, user?.metadata]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (sdkHasLoaded && !isLoggedIn) redirect("/");
  }, [sdkHasLoaded, isLoggedIn]);

  const formatCardNumber = () => {
    if (!cardData?.last4) return <Skeleton className="w-36 h-6 rounded-sm" />;
    if (showDecryptedData && decryptedCardData?.cardNumber) {
      return decryptedCardData.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
    }
    if (cardData?.last4.length !== 4) return cardData?.last4;
    return `•••• •••• •••• ${cardData?.last4}`;
  };

  const getCardCvv = () => {
    if (showDecryptedData && decryptedCardData?.cvv) {
      return decryptedCardData.cvv;
    }
    return "•••";
  };

  const formatExpiration = () => {
    if (!cardData?.expirationMonth || !cardData?.expirationYear) {
      return <Skeleton className="w-6 h-3 rounded-xs" />;
    }
    return `${cardData?.expirationMonth.padStart(
      2,
      "0"
    )}/${cardData?.expirationYear.slice(-2)}`;
  };

  const handleCardDetailsSuccess = (cardNumber: string, cvv: string) => {
    setDecryptedCardData({ cardNumber, cvv });
    setShowDecryptedData(true);
  };

  const toggleCardDataVisibility = () => {
    setShowDecryptedData(!showDecryptedData);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <TokenBalanceProvider>
      <Card className="gap-4">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet2 className="h-8 w-8 text-muted-foreground" />
            </Button>
            <StablecoinFaucet />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center gap-4">
          <CreditCard
            type="gray-dark"
            cardType="visa"
            company={
              <DynamicLogo width={120} height={25} className="text-white" />
            }
            cardNumber={formatCardNumber()}
            cardCvv={getCardCvv()}
            cardExpiration={formatExpiration()}
            showCopyIcons={showDecryptedData && !!decryptedCardData}
            onCopyCardNumber={() =>
              decryptedCardData &&
              copyToClipboard(decryptedCardData.cardNumber, "cardNumber")
            }
            onCopyCvv={() =>
              decryptedCardData && copyToClipboard(decryptedCardData.cvv, "cvv")
            }
            copiedField={copiedField}
          />

          <CardBalance />

          {/* Action Buttons Row */}
          <div className="flex justify-center gap-10">
            <FundCard />
            <CardDetails
              disabled={!cardData}
              onDetailsSuccess={handleCardDetailsSuccess}
              showDecryptedData={showDecryptedData}
              onToggleVisibility={toggleCardDataVisibility}
            />
          </div>
          <CardTransactions />
        </CardContent>

        <AccountModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      </Card>
    </TokenBalanceProvider>
  );
}
