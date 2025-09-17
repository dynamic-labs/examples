import React from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core";

// Market mode configuration
const MARKET_MODE_CONFIG = {
  supply: {
    placeholder: "Amount in Collateral",
    buttonText: "Supply Collateral",
    loadingText: "Supplying...",
  },
  withdraw: {
    placeholder: "Amount in Collateral",
    buttonText: "Withdraw Collateral",
    loadingText: "Withdrawing...",
  },
  borrow: {
    placeholder: "Amount in Loan Token",
    buttonText: "Borrow Loan Token",
    loadingText: "Borrowing...",
  },
  repay: {
    placeholder: "Amount in Loan Token",
    buttonText: "Repay Loan Token",
    loadingText: "Repaying...",
  },
} as const;

interface MarketsFormProps {
  mode: "supply" | "withdraw" | "borrow" | "repay";
  amount: string;
  onAmountChange: (amount: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onApproveLoanToken?: () => void;
  onApproveCollateral?: () => void;
  isConnected: boolean;
  isSupplying: boolean;
  isWithdrawing: boolean;
  isBorrowing: boolean;
  isRepaying: boolean;
  isApprovingLoanToken: boolean;
  isApprovingCollateral: boolean;
  needsLoanTokenApproval: boolean;
  needsCollateralApproval: boolean;
  loanTokenSymbol?: string;
  collateralSymbol?: string;
}

export function MarketsForm({
  mode,
  amount,
  onAmountChange,
  onSubmit,
  onApproveLoanToken,
  onApproveCollateral,
  isConnected,
  isSupplying,
  isWithdrawing,
  isBorrowing,
  isRepaying,
  isApprovingLoanToken,
  isApprovingCollateral,
  needsLoanTokenApproval,
  needsCollateralApproval,
  loanTokenSymbol = "Loan Token",
  collateralSymbol = "Collateral",
}: MarketsFormProps) {
  const config = MARKET_MODE_CONFIG[mode];
  const isPending = isSupplying || isWithdrawing || isBorrowing || isRepaying;

  const getButtonText = () => {
    if (isPending) {
      return config.loadingText;
    }
    return config.buttonText;
  };
  const needsApproval =
    mode === "borrow" || mode === "repay"
      ? needsLoanTokenApproval
      : needsCollateralApproval;
  const isApproving =
    mode === "borrow" || mode === "repay"
      ? isApprovingLoanToken
      : isApprovingCollateral;
  const onApprove =
    mode === "borrow" || mode === "repay"
      ? onApproveLoanToken
      : onApproveCollateral;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
      <Input
        type="number"
        min={0}
        step="any"
        placeholder={config.placeholder}
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        required
      />

      {needsApproval && onApprove && (
        <Button variant="approve" loading={isApproving} onClick={onApprove}>
          {`Approve ${
            mode === "borrow" || mode === "repay"
              ? loanTokenSymbol
              : collateralSymbol
          }`}
        </Button>
      )}

      {!isConnected ? (
        <DynamicConnectButton buttonClassName="border-none rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white outline-2 outline-blue-400 hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-blue-500 hover:not-disabled:to-blue-600 hover:not-disabled:-translate-y-1 hover:not-disabled:shadow-xl hover:not-disabled:shadow-blue-600/502xl py-4.5 font-bold text-lg cursor-pointer mb-1 shadow-lg transition-all duration-300 ease-in-out w-full relative overflow-hidden disabled:cursor-not-allowed disabled:outline-none disabled:opacity-60 disabled:transform-none w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white outline-2 outline-blue-400 hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-blue-500 hover:not-disabled:to-blue-600 hover:not-disabled:-translate-y-1 hover:not-disabled:shadow-xl hover:not-disabled:shadow-blue-600/50">
          Connect Wallet
        </DynamicConnectButton>
      ) : (
        <Button
          type="submit"
          variant="primary"
          disabled={!isConnected || isPending || needsApproval}
          loading={isPending}
        >
          {getButtonText()}
        </Button>
      )}
    </form>
  );
}
