import React from "react";
import { formatUnits } from "viem";

interface MarketsBalanceDisplayProps {
  loanTokenBalance: unknown;
  collateralBalance: unknown;
  borrowed: string | null;
  supplied: string | null;
  borrowedUsd: string | null;
  suppliedUsd: string | null;
  collateral: string | null;
  collateralUsd: string | null;
  healthFactor: string | null;
  loanTokenSymbol?: string;
  collateralSymbol?: string;
  loanTokenDecimals?: number;
  collateralDecimals?: number;
}

export function MarketsBalanceDisplay({
  loanTokenBalance,
  collateralBalance,
  borrowed,
  supplied,
  borrowedUsd,
  suppliedUsd,
  collateral,
  collateralUsd,
  healthFactor,
  loanTokenSymbol = "Loan Token",
  collateralSymbol = "Collateral",
  loanTokenDecimals = 18,
  collateralDecimals = 6,
}: MarketsBalanceDisplayProps) {
  // Format balance values
  const formattedLoanTokenBalance = loanTokenBalance
    ? formatUnits(loanTokenBalance as bigint, loanTokenDecimals)
    : "-";
  const formattedCollateralBalance = collateralBalance
    ? formatUnits(collateralBalance as bigint, collateralDecimals)
    : "-";

  const getHealthFactorClass = (factor: string) => {
    const value = parseFloat(factor);
    if (value < 1.1) return "text-red-500";
    if (value < 1.5) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="mt-6 mb-2 text-base">
      <div>
        <span className="text-gray-400">Your {loanTokenSymbol} balance:</span>{" "}
        <span className="font-bold text-white">
          {formattedLoanTokenBalance}
        </span>
      </div>

      <div>
        <span className="text-gray-400">Your {collateralSymbol} balance:</span>{" "}
        <span className="font-bold text-white">
          {formattedCollateralBalance}
        </span>
      </div>

      <div>
        <span className="text-gray-400">
          Supplied assets ({collateralSymbol}):
        </span>{" "}
        <span className="font-bold text-white">
          {supplied === null ? "-" : supplied}
        </span>
      </div>

      <div>
        <span className="text-gray-400">Supplied assets (USD):</span>{" "}
        <span className="font-bold text-white">
          {suppliedUsd === null ? "-" : suppliedUsd}
        </span>
      </div>

      <div>
        <span className="text-gray-400">Collateral ({collateralSymbol}):</span>{" "}
        <span className="font-bold text-white">
          {collateral === null ? "-" : collateral}
        </span>
      </div>

      <div>
        <span className="text-gray-400">Collateral (USD):</span>{" "}
        <span className="font-bold text-white">
          {collateralUsd === null ? "-" : collateralUsd}
        </span>
      </div>

      <div>
        <span className="text-gray-400">Borrowed ({loanTokenSymbol}):</span>{" "}
        <span className="font-bold text-white">
          {borrowed === null ? "-" : borrowed}
        </span>
      </div>

      <div>
        <span className="text-gray-400">Borrowed (USD):</span>{" "}
        <span className="font-bold text-white">
          {borrowedUsd === null ? "-" : borrowedUsd}
        </span>
      </div>

      {healthFactor && (
        <div>
          <span className="text-gray-400">Health Factor:</span>{" "}
          <span className={`font-bold ${getHealthFactorClass(healthFactor)}`}>
            {healthFactor}
          </span>
        </div>
      )}
    </div>
  );
}
