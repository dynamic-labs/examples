"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { formatUnits } from "viem";
import { useVaultDetail } from "../../../lib/hooks/useVaultDetail";
import { useVaultOperations } from "../../../lib/hooks/useVaultOperations";
import { useAccount } from "wagmi";

export default function VaultDetailPage() {
  const params = useParams();
  const vaultId = params.vaultId as string;
  const { address } = useAccount();
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");

  const { vault, loading, error } = useVaultDetail(vaultId);

  // Create vault info object for operations
  const vaultInfo = vault
    ? {
        address: vault.address,
        asset: {
          address: vault.assetAddress,
          symbol: vault.asset,
          decimals: vault.assetDecimals,
        },
      }
    : null;

  const {
    assetBalance,
    vaultBalance,
    depositedAssets,
    amount,
    setAmount,
    txStatus,
    pendingDeposit,
    handleApprove,
    handleDeposit,
    handleWithdraw,
    isApproving,
    isDepositing,
    isWithdrawing,
    needsApproval,
  } = useVaultOperations(address, vaultInfo);

  const isLoading = isApproving || isDepositing || isWithdrawing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      if (needsApproval) {
        await handleApprove();
      } else if (mode === "deposit") {
        await handleDeposit(e);
      } else {
        await handleWithdraw(e);
      }

      // Reset form on success
      setAmount("");
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed. Please try again.");
    }
  };

  const setMaxAmount = () => {
    if (!vault) return;
    if (mode === "deposit") {
      setAmount(
        assetBalance
          ? formatUnits(assetBalance as bigint, vault.assetDecimals)
          : "0"
      );
    } else {
      setAmount(
        depositedAssets
          ? formatUnits(depositedAssets as bigint, vault.assetDecimals)
          : "0"
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !vault) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading vault: {error || "Vault not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">{vault.name}</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Your Position
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Deposited Assets:</span>
              <span className="font-medium text-white">
                {depositedAssets
                  ? formatUnits(depositedAssets as bigint, vault.assetDecimals)
                  : "0"}{" "}
                {vault.asset}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">USD Value:</span>
              <span className="font-medium text-white">
                {depositedAssets && vault.sharePrice
                  ? `$${(
                      parseFloat(
                        formatUnits(
                          depositedAssets as bigint,
                          vault.assetDecimals
                        )
                      ) * parseFloat(vault.sharePrice.replace("$", ""))
                    ).toFixed(2)}`
                  : "$0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">{vault.asset} Balance:</span>
              <span className="font-medium text-white">
                {assetBalance
                  ? formatUnits(assetBalance as bigint, vault.assetDecimals)
                  : "0"}{" "}
                {vault.asset}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Vault Shares:</span>
              <span className="font-medium text-white">
                {vaultBalance
                  ? formatUnits(vaultBalance as bigint, vault.assetDecimals)
                  : "0"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {mode === "deposit"
              ? `Deposit ${vault.asset}`
              : `Withdraw ${vault.asset}`}
          </h2>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("deposit")}
              className={`px-4 py-2 rounded transition-colors ${
                mode === "deposit"
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setMode("withdraw")}
              className={`px-4 py-2 rounded transition-colors ${
                mode === "withdraw"
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
              }`}
            >
              Withdraw
            </button>
          </div>

          {txStatus && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                txStatus.includes("sent!") || txStatus.includes("success")
                  ? "bg-green-100 border border-green-400 text-green-700"
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}
            >
              {txStatus}
            </div>
          )}

          {pendingDeposit && txStatus.includes("Approval") && (
            <div className="mb-4 p-3 rounded-lg bg-blue-100 border border-blue-400 text-blue-700">
              Approval successful! Preparing deposit transaction...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Amount ({vault.asset})
                </label>
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Max:{" "}
                  {mode === "deposit"
                    ? assetBalance
                      ? formatUnits(assetBalance as bigint, vault.assetDecimals)
                      : "0"
                    : depositedAssets
                    ? formatUnits(
                        depositedAssets as bigint,
                        vault.assetDecimals
                      )
                    : "0"}
                </button>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
                className="w-full p-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/5 text-white placeholder:text-gray-400"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 text-white py-3 rounded-lg transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {pendingDeposit
                    ? "Approving & Depositing..."
                    : "Processing..."}
                </span>
              ) : needsApproval ? (
                `Approve & Deposit ${amount} ${vault.asset}`
              ) : mode === "deposit" ? (
                `Deposit ${vault.asset}`
              ) : (
                `Withdraw ${vault.asset}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
