/**
 * Main delegation component - manages delegation status and UI flow
 *
 * This component orchestrates the delegation experience:
 * - Shows loading state while SDK initializes
 * - Displays wallet connection prompt if no wallet connected
 * - Shows delegation status header with enabled/disabled state
 * - Tabbed interface for Modal UI vs Custom UI delegation approaches
 * - Renders methods panel for delegated wallets
 *
 * This is the main entry point for the delegation UI. Import this
 * component wherever you want to display delegation functionality.
 */
"use client";

import { useState } from "react";
import { Sparkles, Code2, Loader2 } from "lucide-react";
import { useUser, useWalletAccounts, useInitStatus } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { hasDelegatedAccess } from "@dynamic-labs-sdk/client/waas";
import { dynamicClient } from "@/lib/dynamic";

import DelegatedAccessInit from "./init";
import DelegatedAccessMethods from "./methods";
import DelegationManagement from "./management";
import RecoveryOnlyFlagTest from "./recovery-only-test";
import DelegationStatusHeader from "./components/delegation-status-header";
import ConnectedWalletInfo from "./components/connected-wallet-info";
import ConnectWalletPrompt from "./components/connect-wallet-prompt";
import WalletStatusTable from "./components/wallet-status-table";
import DelegationInfoBox from "@/components/info/delegation-info-box";

type DelegationTab = "modal" | "custom";

export default function DelegatedAccess() {
  const user = useUser();
  const accounts = useWalletAccounts();
  const initStatus = useInitStatus();
  const sdkHasLoaded = initStatus === "finished";
  const primaryWallet = accounts.find(isEvmWalletAccount) ?? null;
  const [activeTab, setActiveTab] = useState<DelegationTab>("modal");

  if (!sdkHasLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-dynamic" />
      </div>
    );
  }

  // Derive wallet delegation statuses from the new SDK
  const walletStatuses = accounts
    .filter(isEvmWalletAccount)
    .map((account) => {
      let isDelegated = false;
      try {
        isDelegated = hasDelegatedAccess({ walletAccount: account }, dynamicClient);
      } catch {
        isDelegated = false;
      }
      return {
        address: account.address,
        status: isDelegated ? "delegated" : "pending",
      };
    });

  const primaryWalletDelegationStatus = primaryWallet
    ? walletStatuses.find((wallet) => wallet.address === primaryWallet.address)
    : undefined;

  const delegatedAccessEnabled = walletStatuses.some(
    (wallet) => wallet.status === "delegated"
  );

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <DelegationStatusHeader
          isEnabled={delegatedAccessEnabled}
          requiresDelegation={false}
        />

        <div className={primaryWallet ? "p-6 space-y-4" : "px-4 py-2"}>
          {primaryWallet ? (
            <div className="space-y-4">
              <ConnectedWalletInfo address={primaryWallet.address} />
              <WalletStatusTable walletStatuses={walletStatuses} />
            </div>
          ) : (
            <ConnectWalletPrompt />
          )}
        </div>
      </div>

      {/* Tabbed Delegation Approaches */}
      {primaryWallet && primaryWalletDelegationStatus?.status === "pending" && (
        <div className="space-y-4">
          {/* Tab Navigation */}
          <DelegationTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === "modal" ? (
            <DelegatedAccessInit />
          ) : (
            <DelegationManagement />
          )}
        </div>
      )}

      {/* Methods Panel - shows when delegated */}
      {primaryWallet &&
        primaryWalletDelegationStatus?.status === "delegated" && (
          <>
            <DelegatedAccessMethods />
            <RecoveryOnlyFlagTest />
          </>
        )}

      <DelegationInfoBox />
    </div>
  );
}

function DelegationTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: DelegationTab;
  onTabChange: (tab: DelegationTab) => void;
}) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <button
        onClick={() => onTabChange("modal")}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
          activeTab === "modal"
            ? "bg-background text-dynamic shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>Modal UI</span>
      </button>
      <button
        onClick={() => onTabChange("custom")}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
          activeTab === "custom"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Code2 className="w-4 h-4" />
        <span>Custom UI</span>
      </button>
    </div>
  );
}
