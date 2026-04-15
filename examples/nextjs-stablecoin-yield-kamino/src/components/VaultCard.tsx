"use client";

import { useState } from "react";
import type { EnrichedVault, UserPosition } from "@/lib/types";
import {
  formatAPY,
  formatUSD,
  formatTokenAmount,
  shortenAddress,
} from "@/lib/utils";
import { ExternalLink, TrendingUp, Users, DollarSign } from "lucide-react";

interface VaultCardProps {
  vault: EnrichedVault;
  position?: UserPosition;
  isOperating: boolean;
  primaryWallet: { address: string } | null;
  onDeposit: (vaultAddress: string, amount: number) => Promise<boolean>;
  onWithdraw: (vaultAddress: string, shares: number) => Promise<boolean>;
}

export function VaultCard({
  vault,
  position,
  isOperating,
  primaryWallet,
  onDeposit,
  onWithdraw,
}: VaultCardProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  const isConnected = !!primaryWallet;
  const m = vault.metrics;

  // Prefer 30d APY for stability; fall back to current
  const displayApy = m ? (m.apy30d > 0 ? m.apy30d : m.apy) : 0;
  const tvl = m?.tvlUsd ?? 0;
  const price = m?.tokenPrice ?? 0;
  const holders = m?.numberOfHolders ?? 0;

  const vaultName = vault.state.name?.trim() || shortenAddress(vault.address);
  const perfFee = vault.state.performanceFeeBps ?? 0;
  const mgmtFee = vault.state.managementFeeBps ?? 0;

  return (
    <div
      className="bg-white rounded-xl flex flex-col"
      style={{ border: "1px solid #DADADA" }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="p-4 border-b" style={{ borderColor: "#DADADA" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#606060] uppercase tracking-wide">
              {vault.tokenName}
            </p>
            <h3 className="text-base font-semibold text-[#030303] mt-0.5 truncate">
              {vault.tokenSymbol}
              {vaultName && vaultName !== shortenAddress(vault.address) && (
                <span className="ml-1.5 text-xs font-normal text-[#606060]">
                  {vaultName}
                </span>
              )}
            </h3>
            <a
              href={`https://app.kamino.finance/liquidity/${vault.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#606060] hover:text-[#4779FF] mt-0.5 transition-colors"
            >
              {shortenAddress(vault.address)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* APY badge */}
          {displayApy > 0 && (
            <div
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-sm font-semibold"
              style={{ background: "#E8F0FE", color: "#1967D2" }}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {formatAPY(displayApy)}
            </div>
          )}
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#606060] uppercase tracking-wide">
              <DollarSign className="h-3 w-3" />
              TVL
            </div>
            <p className="text-sm font-semibold text-[#030303] mt-0.5">
              {tvl > 0 ? formatUSD(tvl) : "—"}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#606060] uppercase tracking-wide">
              <DollarSign className="h-3 w-3" />
              Price
            </div>
            <p className="text-sm font-semibold text-[#030303] mt-0.5">
              {price > 0 ? formatUSD(price) : "—"}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#606060] uppercase tracking-wide">
              <Users className="h-3 w-3" />
              Holders
            </div>
            <p className="text-sm font-semibold text-[#030303] mt-0.5">
              {holders > 0 ? holders.toLocaleString() : "—"}
            </p>
          </div>
        </div>

        {/* APY breakdown row */}
        {m && (m.apy7d > 0 || m.apy30d > 0) && (
          <div className="flex gap-3 mt-2 pt-2 border-t" style={{ borderColor: "#DADADA" }}>
            {m.apy7d > 0 && (
              <div>
                <span className="text-[10px] text-[#606060]">7d APY </span>
                <span className="text-[10px] font-semibold text-[#030303]">{formatAPY(m.apy7d)}</span>
              </div>
            )}
            {m.apy30d > 0 && (
              <div>
                <span className="text-[10px] text-[#606060]">30d APY </span>
                <span className="text-[10px] font-semibold text-[#030303]">{formatAPY(m.apy30d)}</span>
              </div>
            )}
            {(perfFee > 0 || mgmtFee > 0) && (
              <div className="ml-auto">
                <span className="text-[10px] text-[#606060]">
                  Fee {((perfFee + mgmtFee) / 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Position banner ──────────────────────────────────────────── */}
      {position && (
        <div
          className="px-4 py-2 text-xs"
          style={{ background: "#E8F0FE", borderBottom: "1px solid #DADADA" }}
        >
          <span className="font-medium text-[#1967D2]">Your position: </span>
          <span className="text-[#1967D2]">
            {formatTokenAmount(position.tokenBalance, vault.decimals)} {vault.tokenSymbol}
          </span>
          <span className="text-[#4779FF] ml-1">({formatUSD(position.usdValue)})</span>
        </div>
      )}

      {/* ── Deposit / Withdraw ────────────────────────────────────────── */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Tab selector */}
        <div
          className="flex rounded-lg p-0.5 gap-0.5"
          style={{ background: "#F0F0F0" }}
        >
          {(["deposit", "withdraw"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all"
              style={
                activeTab === tab
                  ? { background: "#fff", color: "#030303", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { color: "#606060" }
              }
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Deposit panel */}
        {activeTab === "deposit" && (
          <div className="space-y-2">
            <p className="text-xs text-[#606060]">
              Deposit {vault.tokenSymbol} to earn{" "}
              {displayApy > 0 ? formatAPY(displayApy) : "yield"} APY (30d avg)
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={`Amount (${vault.tokenSymbol})`}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={isOperating}
                className="flex-1 text-xs px-3 py-2 rounded-lg text-[#030303] outline-none focus:ring-1"
                style={{ border: "1px solid #DADADA", background: "#fff" }}
              />
              <button
                onClick={async () => {
                  const n = parseFloat(depositAmount);
                  if (!isNaN(n) && n > 0) {
                    const ok = await onDeposit(vault.address, n);
                    if (ok) setDepositAmount("");
                  }
                }}
                disabled={isOperating || !isConnected || !depositAmount || parseFloat(depositAmount) <= 0}
                className="px-3 py-2 text-xs font-medium rounded-lg text-white transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#4779FF" }}
              >
                {isOperating ? "…" : "Deposit"}
              </button>
            </div>
            {!isConnected && (
              <p className="text-xs text-[#606060]">Sign in to deposit</p>
            )}
          </div>
        )}

        {/* Withdraw panel */}
        {activeTab === "withdraw" && (
          <div className="space-y-2">
            <p className="text-xs text-[#606060]">
              {position
                ? `You have ${formatTokenAmount(parseFloat(position.shares), 2)} shares`
                : "Enter shares to withdraw"}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Shares to withdraw"
                value={withdrawShares}
                onChange={(e) => setWithdrawShares(e.target.value)}
                disabled={isOperating}
                className="flex-1 text-xs px-3 py-2 rounded-lg text-[#030303] outline-none focus:ring-1"
                style={{ border: "1px solid #DADADA", background: "#fff" }}
              />
              <button
                onClick={async () => {
                  const n = parseFloat(withdrawShares);
                  if (!isNaN(n) && n > 0) {
                    const ok = await onWithdraw(vault.address, n);
                    if (ok) setWithdrawShares("");
                  }
                }}
                disabled={isOperating || !isConnected || !position || !withdrawShares || parseFloat(withdrawShares) <= 0}
                className="px-3 py-2 text-xs font-medium rounded-lg text-white transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#EA580C" }}
              >
                {isOperating ? "…" : "Withdraw"}
              </button>
            </div>
            {position && (
              <button
                onClick={() => setWithdrawShares(position.shares)}
                className="text-xs hover:underline"
                style={{ color: "#4779FF" }}
                disabled={isOperating}
              >
                Max: {formatTokenAmount(parseFloat(position.shares), 2)} shares
              </button>
            )}
            {!isConnected && (
              <p className="text-xs text-[#606060]">Sign in to withdraw</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
