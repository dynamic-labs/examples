"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { getAuthToken, useDynamicContext } from "@/lib/dynamic";
import { UserDepositContractResponse, UserWithdrawalRequest } from "@/lib/rain";
import { useWithdrawAsset } from "@/hooks/use-withdraw-asset";
import { getContractAddress } from "@/constants";
import { formatBalance } from "@/utils/format-balance";

const PRESET_AMOUNTS = [5, 10, 25, 50];

export default function WithdrawFunds() {
  const authToken = getAuthToken();
  const { sdkHasLoaded, primaryWallet, network, user } = useDynamicContext();
  const { withdrawAsset, isPending: isWithdrawPending } = useWithdrawAsset();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Fetch card balance for withdrawal validation
  const { data: cardBalanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["balance"],
    enabled: !!sdkHasLoaded && !!user,
    queryFn: () =>
      fetch("/api/balance", {
        headers: { Authorization: `Bearer ${authToken}` },
      }).then((res) => res.json()),
  });

  const { data: contracts, isLoading: isLoadingContracts } = useQuery<{
    contract: UserDepositContractResponse;
  }>({
    queryKey: ["contracts", primaryWallet?.address, network],
    enabled: !!sdkHasLoaded && !!primaryWallet && !!network,
    queryFn: async () => {
      const authToken = getAuthToken();
      const response = await fetch(`/api/contracts?chain=${network}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) throw new Error("Deposit account pending creation");
      return response.json();
    },
  });

  const validateAmount = (value: string): boolean => {
    const num = parseFloat(value);
    const maxWithdrawal = (cardBalanceData?.balance?.spendingPower || 0) / 100; // Convert from cents to dollars

    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid amount");
      return false;
    }
    if (num > maxWithdrawal) {
      setError(`Maximum withdrawal is $${maxWithdrawal.toFixed(2)}`);
      return false;
    }
    if (num < 1) {
      setError("Minimum withdrawal is $1");
      return false;
    }
    setError("");
    return true;
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const decimalCount = (cleanValue.match(/\./g) || []).length;
    if (decimalCount > 1) return;

    // Limit to 2 decimal places
    const parts = cleanValue.split(".");
    if (parts[1] && parts[1].length > 2) return;

    setAmount(cleanValue);
    if (cleanValue) {
      validateAmount(cleanValue);
    } else {
      setError("");
    }
  };

  const handlePresetAmount = (presetAmount: number) => {
    setAmount(presetAmount.toString());
    setError("");
    setShowCustomInput(false);
  };

  const handleWithdraw = async () => {
    if (!validateAmount(amount)) return;
    if (!contracts?.contract.proxyAddress) return;
    if (!primaryWallet) return;
    if (!network) return;

    try {
      const rusdcAddress = getContractAddress(network, "RUSDC");

      // Request withdrawal signature from API
      const response = await fetch("/api/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          chainId: Number(network),
          token: rusdcAddress,
          amount: (parseFloat(amount) * 100).toString(), // Convert dollars to cents
          adminAddress: contracts.contract.proxyAddress,
          // Note: This is temporary
          recipientAddress: primaryWallet.address,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get withdrawal signature");
      }

      const withdrawalData = (await response.json()) as UserWithdrawalRequest;

      // Execute withdrawal using the full withdrawal data
      await withdrawAsset(contracts.contract.controllerAddress, withdrawalData);

      // Reset form on success
      setAmount("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setError("Withdrawal failed. Please try again.");
    }
  };

  const canSubmit =
    amount && !error && !isWithdrawPending && !isLoadingContracts;

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAmount("");
    setError("");
    setShowCustomInput(false);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-14 w-14 transition-all duration-200 ease-out hover:scale-110 hover:shadow-sm hover:shadow-primary/10 active:scale-105"
                onClick={() => setIsModalOpen(true)}
                // disabled={!sdkHasLoaded || isLoadingContracts}
                disabled={true}
              >
                {!sdkHasLoaded || isLoadingContracts ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Minus className="h-5 w-5" />
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Coming soon</p>
          </TooltipContent>
        </Tooltip>
        <span className="text-xs text-foreground">Send</span>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Withdraw Funds"
        description="Choose an amount to withdraw from your card"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Available Balance
              </span>
              <div className="text-xl font-semibold text-foreground">
                {isLoadingBalance ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  formatBalance(cardBalanceData?.balance?.spendingPower || 0)
                )}
              </div>
            </div>
          </div>
          {/* Amount Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  variant={
                    amount === presetAmount.toString() && !showCustomInput
                      ? "default"
                      : "outline"
                  }
                  size="lg"
                  onClick={() => handlePresetAmount(presetAmount)}
                  className="h-12"
                >
                  ${presetAmount}
                </Button>
              ))}
            </div>

            {!showCustomInput ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setShowCustomInput(true);
                  setAmount("");
                }}
                className="h-12 w-full"
              >
                Enter custom amount
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="text"
                    placeholder="Custom amount"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pl-8 h-12 text-center"
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleWithdraw()}
              disabled={!canSubmit}
              className="flex-1 h-12"
            >
              {isWithdrawPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Withdrawing...
                </>
              ) : (
                <>Withdraw ${amount || "0"}</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
