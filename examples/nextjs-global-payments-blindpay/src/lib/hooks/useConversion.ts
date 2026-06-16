import { useState } from "react";
import { ConversionData, ConversionResult } from "@/types";
import { ConversionService } from "@/lib/services/conversionService";
import { approveUSDBTokens } from "@/lib/walletInteractions";

export function useConversion() {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(null);

  const handleStableToFiatConversion = async (
    data: ConversionData,
    bankAccountId: string,
    walletAddress: string
  ) => {
    setIsConverting(true);
    try {
      // Create quote
      const quoteResult = await ConversionService.createStableToFiatQuote(
        data,
        bankAccountId,
        walletAddress
      );

      if (!quoteResult.success || quoteResult.step !== "quote_created") {
        throw new Error("Quote creation failed");
      }

      // Check if the quote contains contract information for token approval

      let approvalTxHash: string;
      if (quoteResult.quote.contract) {
        const {
          address: contractAddress,
          blindpayContractAddress: spenderAddress,
          amount: approvalAmount,
        } = quoteResult.quote.contract;

        approvalTxHash = await approveUSDBTokens(
          contractAddress,
          spenderAddress,
          approvalAmount
        );
      } else {
        // If no contract info in quote, we might need to handle this differently
        // For now, throw an error to indicate the issue

        throw new Error(
          "Quote response does not contain contract approval information. Please check API documentation for the correct approval flow."
        );
      }

      // Execute conversion
      const payoutResult =
        await ConversionService.executeStableToFiatConversion(
          data,
          bankAccountId,
          walletAddress,
          approvalTxHash,
          quoteResult.quote.id
        );

      if (payoutResult.success) {
        setConversionResult(payoutResult.conversion);
        return { success: true, conversion: payoutResult.conversion };
      } else {
        throw new Error("Payout failed");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

  const handleFiatToStableConversion = async (
    data: ConversionData,
    blockchainWalletId: string,
    receiverId: string
  ) => {
    setIsConverting(true);
    try {
      // Create quote
      const quoteResult = await ConversionService.createFiatToStableQuote(
        data,
        blockchainWalletId,
        receiverId
      );

      if (!quoteResult.success) {
        throw new Error("Failed to create quote");
      }

      // Execute conversion
      const payinResult = await ConversionService.executeFiatToStableConversion(
        quoteResult.quote.id
      );

      if (payinResult.success) {
        const conversion: ConversionResult = {
          id: payinResult.payin.id,
          fromCurrency: data.fromCurrency,
          toCurrency: data.toCurrency,
          fromAmount: data.fromAmount,
          toAmount: parseFloat(quoteResult.quote.amount) / 100,
          status: "processing",
          blindpay: {
            payinId: payinResult.payin.id,
            memoCode: payinResult.memoCode,
            bankingDetails: payinResult.bankingDetails,
          },
        };

        setConversionResult(conversion);
        return { success: true, conversion };
      } else {
        throw new Error("Payin failed");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

  const clearConversionResult = () => {
    setConversionResult(null);
  };

  return {
    isConverting,
    conversionResult,
    handleStableToFiatConversion,
    handleFiatToStableConversion,
    clearConversionResult,
  };
}
