/**
 * Main delegation component - manages delegation status and UI flow
 *
 * This component orchestrates the delegation experience:
 * - Shows loading state while SDK initializes
 * - Displays wallet connection prompt if no wallet connected
 * - Shows delegation status header with enabled/disabled state
 * - Renders init flow for wallets pending delegation
 * - Renders methods panel for delegated wallets
 *
 * This is the main entry point for the delegation UI. Import this
 * component wherever you want to display delegation functionality.
 */
"use client";

import {
  SpinnerIcon,
  useDynamicContext,
  useWalletDelegation,
} from "@dynamic-labs/sdk-react-core";

import DelegatedAccessInit from "./init";
import DelegatedAccessMethods from "./methods";
import DelegationStatusHeader from "./components/delegation-status-header";
import ConnectedWalletInfo from "./components/connected-wallet-info";
import ConnectWalletPrompt from "./components/connect-wallet-prompt";
import WalletStatusTable from "./components/wallet-status-table";
import DelegationInfoBox from "@/components/info/delegation-info-box";

export default function DelegatedAccess() {
  const { sdkHasLoaded, primaryWallet } = useDynamicContext();
  const { delegatedAccessEnabled, getWalletsDelegatedStatus } =
    useWalletDelegation();

  if (!sdkHasLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerIcon className="w-10 h-10 animate-spin text-dynamic" />
      </div>
    );
  }

  const walletStatuses = getWalletsDelegatedStatus();
  const primaryWalletDelegationStatus = walletStatuses.find(
    (wallet) => wallet.address === primaryWallet?.address
  );

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <DelegationStatusHeader isEnabled={delegatedAccessEnabled ?? false} />

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

      {/* Conditional Components */}
      {primaryWallet && primaryWalletDelegationStatus?.status === "pending" && (
        <DelegatedAccessInit />
      )}
      {primaryWallet &&
        primaryWalletDelegationStatus?.status === "delegated" && (
          <DelegatedAccessMethods />
        )}

      <DelegationInfoBox />
    </div>
  );
}
