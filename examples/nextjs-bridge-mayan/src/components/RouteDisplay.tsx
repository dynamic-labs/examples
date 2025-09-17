"use client";

import { Quote } from "@mayanfinance/swap-sdk";
import { getChainByKey } from "@/constants/chains";

interface RouteDisplayProps {
  quote: Quote | null;
  toTokenSymbol?: string;
}

// Helper function to format amounts
const formatAmount = (amount: string, decimals: number): string => {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toFixed(6);
};

export default function RouteDisplay({
  quote,
  toTokenSymbol,
}: RouteDisplayProps) {
  if (!quote) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Swap Quote</h3>

      <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">You get:</span>
            <span className="font-medium text-gray-900">
              {formatAmount(
                quote.expectedAmountOut.toString(),
                quote.toToken.decimals
              )}{" "}
              {toTokenSymbol || quote.toToken.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Route:</span>
            <span className="text-sm text-gray-500">
              {quote.fromChain} → {quote.toChain}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Fee:</span>
            <span className="text-sm text-gray-500">
              {quote.fee} {quote.fromToken.symbol}
            </span>
          </div>

          {quote.estimatedTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estimated Time:</span>
              <span className="text-sm text-gray-500">
                ~{Math.ceil(quote.estimatedTime / 60)} min
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
