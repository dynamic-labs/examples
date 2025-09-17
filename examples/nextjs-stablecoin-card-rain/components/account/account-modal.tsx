"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Copy, Check, LogOut, Coins, Wallet2, CreditCard } from "lucide-react";
import { useDynamicContext } from "@/lib/dynamic";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBalance } from "@/utils/format-balance";
import { formatAddress } from "@/utils/format-address";
import { getContractAddress } from "@/constants";
import { UserCreditBalanceResponse } from "@/lib/rain";
import NetworkSelector from "./network-selector";
import { useTokenBalanceContext } from "../dynamic-card/token-balance-context";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { primaryWallet, network, handleLogOut, user } = useDynamicContext();
  const enabledNetworks = primaryWallet?.connector.getEnabledNetworks();
  const authToken = getAuthToken();
  const { getBalanceByAddress, isLoading: isLoadingBalances } =
    useTokenBalanceContext();
  const [copied, setCopied] = useState<string | null>(null);
  const [addressContainerWidth, setAddressContainerWidth] = useState<number>(0);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const rusdcAddress = useMemo(() => {
    if (!network) return undefined;
    return getContractAddress(network, "RUSDC");
  }, [network]);
  const walletBalance = getBalanceByAddress(rusdcAddress || "");

  // Fetch card balance
  const { data: cardBalanceData, isLoading: isLoadingCardBalance } = useQuery<{
    balance: UserCreditBalanceResponse;
  }>({
    queryKey: ["balance"],
    queryFn: () =>
      fetch("/api/balance", {
        headers: { Authorization: `Bearer ${authToken}` },
      }).then((res) => res.json()),
  });

  // Measure address container width
  useEffect(() => {
    const measureWidth = () => {
      if (addressContainerRef.current) {
        setAddressContainerWidth(addressContainerRef.current.offsetWidth);
      }
    };

    if (isOpen) {
      const timer = setTimeout(measureWidth, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleLogout = () => {
    handleLogOut();
    onClose();
  };

  // Resolve current network info directly from Dynamic's enabled networks
  const currentNetwork = useMemo(() => {
    const found = enabledNetworks?.find(
      (n) => String(n.chainId || n.networkId) === String(network)
    );

    if (!found) {
      return {
        id: String(network || ""),
        name: `Network ${network ?? ""}`,
        iconUrl: undefined,
      };
    }

    return {
      id: String(found.chainId || found.networkId || ""),
      name: found.vanityName || found.name,
      iconUrl: found.iconUrls?.[0] || undefined,
    };
  }, [primaryWallet, network]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <div className="flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="relative overflow-hidden rounded-xl bg-linear-to-tr from-gray-900 to-gray-700 p-4 text-white before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset">
          <div className="relative space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Wallet2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{user?.email}</p>
                  <div className="flex items-center gap-2">
                    {currentNetwork.iconUrl ? (
                      <img
                        src={currentNetwork.iconUrl}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <span className="inline-block w-3 h-3 rounded-full bg-white/30" />
                    )}
                    <p className="text-xs opacity-70">{currentNetwork.name}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={() =>
                  primaryWallet?.address &&
                  copyToClipboard(primaryWallet.address, "address")
                }
              >
                {copied === "address" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="pt-2">
              <p className="text-xs opacity-70 mb-1">Address</p>
              <div ref={addressContainerRef} className="font-mono text-sm">
                {primaryWallet?.address
                  ? formatAddress(primaryWallet.address, addressContainerWidth)
                  : "Not connected"}
              </div>
            </div>
          </div>
        </div>

        {/* Minimal, neutral balances */}
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Wallet
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {isLoadingBalances ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {walletBalance?.balance.toLocaleString() || "0"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">rUSDC</p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Card
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {isLoadingCardBalance ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {formatBalance(cardBalanceData?.balance?.spendingPower || 0)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </div>
        </div>
        <NetworkSelector currentNetwork={currentNetwork} />
      </div>
    </Modal>
  );
}
