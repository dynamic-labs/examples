"use client";

import {
  useDynamicContext,
  useTokenBalances,
} from "@dynamic-labs/sdk-react-core";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useLiFi } from "@/lib/hooks/useLiFi";
import { loadLiFiTokens } from "@/lib/lifi";
import type { Token } from "@lifi/sdk";
import { USDC_MINT, WSOL_MINT } from "@/lib/constants";

interface LiFiViewProps {
  embeddedWalletAddress: string;
  onBack: () => void;
}

type View = "select" | "amount" | "executing" | "success";

// Solana mainnet chain ID in LiFi
const SOLANA_CHAIN_ID = 1151111081099710;
// Native SOL system program address used by LiFi
const NATIVE_SOL_ADDRESS = "11111111111111111111111111111111";

const isSolNativeToken = (address?: string): boolean => {
  if (!address) return true;
  return (
    address === NATIVE_SOL_ADDRESS ||
    address.toLowerCase() === WSOL_MINT.toLowerCase()
  );
};

export function LiFiView({ embeddedWalletAddress, onBack }: LiFiViewProps) {
  const { primaryWallet } = useDynamicContext();
  const [view, setView] = useState<View>("select");
  const [solanaTokens, setSolanaTokens] = useState<Token[]>([]);
  const [selectedFromToken, setSelectedFromToken] = useState<Token | null>(null);
  const [selectedToToken, setSelectedToToken] = useState<Token | null>(null);
  const [tokenAmount, setTokenAmount] = useState("");

  const { tokenBalances, isLoading: isLoadingBalances } = useTokenBalances({
    accountAddress: primaryWallet?.address,
    networkId: SOLANA_CHAIN_ID,
    includeNativeBalance: true,
    includeFiat: false,
    filterSpamTokens: true,
  });

  const { getRoutesForSwap, executeSwap, isLoading, error, clearError } =
    useLiFi();

  // Load all Solana tokens
  useEffect(() => {
    loadLiFiTokens(SOLANA_CHAIN_ID).then((tokens) => {
      setSolanaTokens(tokens);
      // Default to native SOL as source
      const sol = tokens.find((t) => isSolNativeToken(t.address));
      if (sol && !selectedFromToken) setSelectedFromToken(sol);
      // Default USDC as destination
      const usdc = tokens.find(
        (t) => t.address.toLowerCase() === USDC_MINT.toLowerCase()
      );
      if (usdc) setSelectedToToken(usdc);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tokens the user actually has balance for
  const userTokensWithBalance = useMemo(() => {
    if (!tokenBalances) return [];
    return tokenBalances.filter((b) => b.balance > 0);
  }, [tokenBalances]);

  // Filter to tokens with balance
  const fromTokens = useMemo(() => {
    return solanaTokens.filter((token) => {
      if (isSolNativeToken(token.address)) {
        return userTokensWithBalance.some((b) => isSolNativeToken(b.address));
      }
      return userTokensWithBalance.some(
        (b) => b.address.toLowerCase() === token.address.toLowerCase()
      );
    });
  }, [solanaTokens, userTokensWithBalance]);

  const userBalance = useMemo(() => {
    if (!selectedFromToken) return null;
    if (isSolNativeToken(selectedFromToken.address)) {
      return userTokensWithBalance.find((b) => isSolNativeToken(b.address));
    }
    return userTokensWithBalance.find(
      (b) => b.address.toLowerCase() === selectedFromToken.address.toLowerCase()
    );
  }, [selectedFromToken, userTokensWithBalance]);

  const handleExecute = useCallback(async () => {
    if (
      !primaryWallet?.address ||
      !selectedFromToken ||
      !selectedToToken ||
      !tokenAmount
    )
      return;

    try {
      clearError();
      setView("executing");

      const routes = await getRoutesForSwap({
        fromChainId: SOLANA_CHAIN_ID,
        toChainId: SOLANA_CHAIN_ID,
        fromTokenAddress: selectedFromToken.address,
        toTokenAddress: selectedToToken.address,
        fromAmount: tokenAmount,
        fromAddress: primaryWallet.address,
        toAddress: embeddedWalletAddress,
      });

      if (routes.length === 0) throw new Error("No routes found");

      await executeSwap(routes[0]);

      window.dispatchEvent(new CustomEvent("depositComplete"));
      setView("success");
    } catch (err) {
      console.error("Swap failed:", err);
      setView("amount");
    }
  }, [
    primaryWallet,
    selectedFromToken,
    selectedToToken,
    tokenAmount,
    embeddedWalletAddress,
    getRoutesForSwap,
    executeSwap,
    clearError,
  ]);

  const handleSetMax = useCallback(() => {
    if (!userBalance) return;
    const isNative = selectedFromToken && isSolNativeToken(selectedFromToken.address);
    // Reserve small amount for transaction fees on Solana
    const max = isNative
      ? Math.max(0, userBalance.balance - 0.005)
      : userBalance.balance;
    setTokenAmount(max.toString());
  }, [userBalance, selectedFromToken]);

  // No Solana wallet connected
  if (!primaryWallet) {
    return (
      <div className="p-[16px] text-center">
        <p className="font-['Clash_Display',sans-serif] text-[16px] text-white mb-[8px]">
          Connect a Solana Wallet
        </p>
        <p className="text-sm font-['Clash_Display',sans-serif] text-[rgba(139,92,246,0.6)]">
          Connect your Solana wallet to swap tokens.
        </p>
      </div>
    );
  }

  // Select View
  if (view === "select") {
    return (
      <div className="p-[16px]">
        <div className="mb-[16px]">
          <p className="font-['Clash_Display',sans-serif] text-[16px] text-white mb-[8px]">
            Swap Solana tokens to USDC
          </p>
        </div>

        <div className="space-y-[12px] mb-[16px]">
          <div>
            <label className="block text-sm font-medium font-['Clash_Display',sans-serif] text-white mb-[8px]">
              From Token
            </label>
            {isLoadingBalances ? (
              <div className="w-full p-[12px] bg-[#1a1b23] border border-[#262a34] rounded-[8px] text-white text-center font-['Clash_Display',sans-serif]">
                Loading tokens...
              </div>
            ) : fromTokens.length === 0 ? (
              <div className="w-full p-[12px] bg-[#1a1b23] border border-[#262a34] rounded-[8px] text-white text-center opacity-75 font-['Clash_Display',sans-serif]">
                No tokens with balance found
              </div>
            ) : (
              <select
                value={selectedFromToken?.address || ""}
                onChange={(e) =>
                  setSelectedFromToken(
                    fromTokens.find((t) => t.address === e.target.value) || null
                  )
                }
                className="w-full p-[12px] bg-[#1a1b23] border border-[#262a34] rounded-[8px] text-white font-['Clash_Display',sans-serif]"
              >
                <option value="">Select token</option>
                {fromTokens.map((token) => {
                  const bal = isSolNativeToken(token.address)
                    ? userTokensWithBalance.find((b) => isSolNativeToken(b.address))
                    : userTokensWithBalance.find(
                        (b) =>
                          b.address.toLowerCase() === token.address.toLowerCase()
                      );
                  return (
                    <option key={token.address || "native"} value={token.address || ""}>
                      {token.symbol}
                      {bal ? ` (${bal.balance.toFixed(4)})` : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="p-[12px] bg-[#0e1015] rounded-[8px] border border-[#262a34]">
            <div className="flex justify-between items-center text-sm">
              <span className="font-['Clash_Display',sans-serif] text-[rgba(139,92,246,0.6)]">
                To
              </span>
              <span className="font-['Clash_Display',sans-serif] text-white">
                {selectedToToken?.symbol || "USDC"} on Solana
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setView("amount");
            clearError();
          }}
          disabled={!selectedFromToken || !selectedToToken}
          className="w-full bg-linear-to-r from-[#8b5cf6] to-[#06b6d4] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-['Clash_Display',sans-serif] font-semibold py-[12px] rounded-[8px]"
        >
          Continue
        </button>
      </div>
    );
  }

  // Amount View
  if (view === "amount") {
    return (
      <div className="p-[16px]">
        <button
          type="button"
          onClick={() => setView("select")}
          className="flex items-center gap-[8px] text-[rgba(139,92,246,0.6)] hover:text-[#8b5cf6] mb-[16px]"
        >
          <svg
            className="w-[16px] h-[16px]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-['Clash_Display',sans-serif]">Back</span>
        </button>

        <div className="mb-[16px]">
          <p className="font-['Clash_Display',sans-serif] text-[16px] text-white">
            Enter amount
          </p>
          <p className="text-xs font-['Clash_Display',sans-serif] text-[rgba(139,92,246,0.6)]">
            {selectedFromToken?.symbol} → {selectedToToken?.symbol}
          </p>
        </div>

        <div className="mb-[16px]">
          <div className="relative">
            <input
              type="number"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-[12px] pr-[60px] bg-[#1a1b23] border border-[#262a34] rounded-[8px] text-white font-['Clash_Display',sans-serif]"
            />
            <button
              type="button"
              onClick={handleSetMax}
              className="absolute right-[8px] top-1/2 -translate-y-1/2 px-[8px] py-[4px] text-xs text-[#8b5cf6] font-['Clash_Display',sans-serif]"
            >
              MAX
            </button>
          </div>
          {userBalance && (
            <div className="mt-[8px] text-sm font-['Clash_Display',sans-serif] text-[rgba(139,92,246,0.6)]">
              Available: {userBalance.balance.toFixed(4)} {selectedFromToken?.symbol}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleExecute}
          disabled={!tokenAmount || parseFloat(tokenAmount) <= 0 || isLoading}
          className="w-full bg-linear-to-r from-[#8b5cf6] to-[#06b6d4] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-['Clash_Display',sans-serif] font-semibold py-[12px] rounded-[8px]"
        >
          {isLoading ? "Processing..." : "Swap"}
        </button>

        {error && (
          <div className="mt-[12px] p-[12px] bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 text-sm font-['Clash_Display',sans-serif]">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Executing View
  if (view === "executing") {
    return (
      <div className="p-[16px] text-center">
        <div className="w-[48px] h-[48px] border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-[16px]" />
        <p className="font-['Clash_Display',sans-serif] text-[16px] text-white">
          Processing transaction...
        </p>
        <p className="text-sm font-['Clash_Display',sans-serif] text-[rgba(139,92,246,0.6)] mt-[8px]">
          Please confirm in your wallet
        </p>
      </div>
    );
  }

  // Success View
  if (view === "success") {
    return (
      <div className="p-[16px] text-center">
        <div className="w-[64px] h-[64px] bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-[16px]">
          <svg
            className="w-[32px] h-[32px] text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="font-['Clash_Display',sans-serif] text-[16px] text-white mb-[16px]">
          Swap Successful!
        </p>
        <button
          type="button"
          onClick={onBack}
          className="w-full bg-linear-to-r from-[#8b5cf6] to-[#06b6d4] hover:opacity-90 text-white font-['Clash_Display',sans-serif] font-semibold py-[12px] rounded-[8px]"
        >
          Done
        </button>
      </div>
    );
  }

  return null;
}
