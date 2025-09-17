import { ConversionData } from "@/types";

export class ConversionService {
  static async createStableToFiatQuote(
    data: ConversionData,
    bankAccountId: string,
    walletAddress: string
  ) {
    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromCurrency: data.fromCurrency,
        toCurrency: data.toCurrency,
        amount: data.fromAmount,
        walletAddress,
        useBlindPayPayout: true,
        bankAccountId,
        token: data.fromCurrency,
        network: "base_sepolia",
        currencyType: "sender",
        coverFees: false,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create quote");
    }

    return response.json();
  }

  static async executeStableToFiatConversion(
    data: ConversionData,
    bankAccountId: string,
    walletAddress: string,
    approvalTxHash: string,
    quoteId: string
  ) {
    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromCurrency: data.fromCurrency,
        toCurrency: data.toCurrency,
        amount: data.fromAmount,
        walletAddress,
        useBlindPayPayout: true,
        approvalTxHash,
        quoteId,
        bankAccountId,
        token: data.fromCurrency,
        network: "base_sepolia",
        currencyType: "sender",
        coverFees: false,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to execute conversion");
    }

    return response.json();
  }

  static async createFiatToStableQuote(
    data: ConversionData,
    blockchainWalletId: string,
    receiverId: string
  ) {
    const response = await fetch("/api/payin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: "create_quote",
        amount: data.fromAmount,
        receiverId,
        token: data.toCurrency,
        paymentMethod: "ach",
        network: "base_sepolia",
        blockchainWalletId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create quote");
    }

    return response.json();
  }

  static async executeFiatToStableConversion(quoteId: string) {
    const response = await fetch("/api/payin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: "initiate_payin",
        quoteId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to execute conversion");
    }

    return response.json();
  }
}
