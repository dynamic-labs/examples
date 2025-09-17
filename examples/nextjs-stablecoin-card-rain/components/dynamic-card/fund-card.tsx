"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { getAuthToken, useDynamicContext } from "@/lib/dynamic";
import { UserDepositContractResponse } from "@/lib/rain";
import { useDepositToken } from "@/hooks/use-deposit-tokens";
import { getContractAddress } from "@/constants";
import DepositAccountLoading from "./deposit-account-loading";
import WalletBalanceDisplay from "./wallet-balance-display";
import { useTokenBalanceContext } from "./token-balance-context";

const PRESET_AMOUNTS = [5, 10, 25];

export default function FundCard() {
  const queryClient = useQueryClient();
  const { depositToken } = useDepositToken();
  const { sdkHasLoaded, primaryWallet, network } = useDynamicContext();
  const { getBalanceByAddress, refetch: fetchAccountBalances } =
    useTokenBalanceContext();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const rusdcAddress = useMemo(() => {
    if (!network) return undefined;
    return getContractAddress(network, "RUSDC");
  }, [network]);
  const walletBalance = getBalanceByAddress(rusdcAddress || "");

  const {
    data,
    isLoading: isLoadingContracts,
    isError: isContractError,
  } = useQuery<{
    contract: UserDepositContractResponse;
  }>({
    queryKey: ["contracts", primaryWallet?.address, network],
    enabled: !!sdkHasLoaded && !!primaryWallet && !!network,
    retry: (_, error) => {
      // Retry when deposit account is not found (being created by 3rd party)
      return error?.message?.includes("Contract not found") || false;
    },
    retryDelay: 1500,
    queryFn: async () => {
      const authToken = getAuthToken();
      const response = await fetch(`/api/contracts?chain=${network}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch deposit account");
      }
      return response.json();
    },
  });

  // Mutation for funding the card
  const fundCardMutation = useMutation({
    mutationFn: async (amount: string) => {
      if (!data?.contract.depositAddress || !primaryWallet || !rusdcAddress) {
        throw new Error("Missing required data");
      }

      await depositToken({
        amount: amount,
        decimals: 6,
        token: rusdcAddress,
        to: data.contract.depositAddress,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch transactions and balance queries
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });

      // Reset form on success
      setAmount("");
      setIsModalOpen(false);
      setError("");
    },
    onError: (error) => {
      console.error("Transfer failed:", error);
      setError(
        "Deposit failed. Please check your wallet balance and try again."
      );
    },
  });

  const validateAmount = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid amount");
      return false;
    }
    if (num > (walletBalance?.balance || 0)) {
      setError(
        `Insufficient balance. You can deposit up to ${
          walletBalance?.balance || 0
        } USDC`
      );
      return false;
    }
    if (num < 1) {
      setError("Minimum deposit amount is 1 USDC");
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

  const handlePresetAmount = (presetAmount: number | "max") => {
    if (presetAmount === "max") {
      const maxAmount = walletBalance?.balance || 0;
      setAmount(maxAmount.toString());
    } else {
      setAmount(presetAmount.toString());
    }
    setError("");
    setShowCustomInput(false);
  };

  const handleFundCard = async () => {
    if (!validateAmount(amount)) return;
    if (!data?.contract.depositAddress) return;
    if (!primaryWallet) return;

    fundCardMutation.mutate(amount);
  };

  const canSubmit =
    amount && !error && !fundCardMutation.isPending && !isLoadingContracts;

  const handleOpenModal = () => {
    if (!sdkHasLoaded || isLoadingContracts) return;
    fetchAccountBalances(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAmount("");
    setError("");
    setShowCustomInput(false);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-14 w-14 transition-all duration-200 ease-out hover:scale-110 hover:shadow-sm hover:shadow-primary/10 active:scale-105"
          onClick={handleOpenModal}
          disabled={!sdkHasLoaded || isLoadingContracts}
        >
          {!sdkHasLoaded || isLoadingContracts ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </Button>
        <span className="text-xs text-foreground">Deposit</span>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Deposit"
        description="Deposit stablecoins from your wallet to your deposit account."
      >
        <div className="flex flex-col gap-6">
          {(() => {
            if (isLoadingContracts || isContractError) {
              return <DepositAccountLoading />;
            }
            return (
              <>
                <div className="flex flex-col gap-3">
                  <WalletBalanceDisplay
                    tokenAddress={rusdcAddress || ""}
                    showUSDC={true}
                  />
                </div>
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
                        disabled={
                          fundCardMutation.isPending ||
                          presetAmount > (walletBalance?.balance || 0)
                        }
                      >
                        ${presetAmount}
                      </Button>
                    ))}
                    <Button
                      key="max"
                      variant={
                        amount === (walletBalance?.balance || 0).toString() &&
                        !showCustomInput
                          ? "default"
                          : "outline"
                      }
                      size="lg"
                      onClick={() => handlePresetAmount("max")}
                      className="h-12"
                      disabled={
                        fundCardMutation.isPending || !walletBalance?.balance
                      }
                    >
                      Max
                    </Button>
                  </div>

                  {/* Custom Amount Button or Input */}
                  {!showCustomInput ? (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setShowCustomInput(true);
                        setAmount("");
                      }}
                      className="h-12 w-full"
                      disabled={
                        fundCardMutation.isPending || !walletBalance?.balance
                      }
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
                          disabled={fundCardMutation.isPending}
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-red-500 text-center">
                          {error}
                        </p>
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
                    disabled={fundCardMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFundCard}
                    disabled={!canSubmit}
                    className="flex-1 h-12"
                  >
                    {fundCardMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Depositing...
                      </>
                    ) : (
                      <>Deposit ${amount || "0"}</>
                    )}
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      </Modal>
    </>
  );
}
