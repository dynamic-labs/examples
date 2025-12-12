"use client";

import {
  SpinnerIcon,
  useDynamicContext,
  useWalletDelegation,
} from "@dynamic-labs/sdk-react-core";
import DelegatedAccessInit from "./init";
import DelegatedAccessMethods from "./methods";

export default function DelegatedAccess() {
  const { sdkHasLoaded, primaryWallet } = useDynamicContext();
  const { delegatedAccessEnabled, getWalletsDelegatedStatus } =
    useWalletDelegation();

  if (!sdkHasLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <SpinnerIcon className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  const walletStatuses = getWalletsDelegatedStatus();
  const primaryWalletDelegationStatus = walletStatuses.find(
    (wallet) => wallet.address === primaryWallet?.address
  );

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <div className="space-y-4">
        {primaryWallet && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-sm font-medium">Primary Wallet</h3>
            <p className="text-xs text-gray-600 font-mono break-all">
              {primaryWallet.address}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <span className="text-sm font-medium">Delegated Access</span>
          <span
            className={`text-sm font-semibold ${
              delegatedAccessEnabled ? "text-green-600" : "text-gray-500"
            }`}
          >
            {delegatedAccessEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        {walletStatuses.length > 0 && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-sm font-medium">
              Wallet Delegation Status
            </h3>
            <div className="space-y-2">
              {walletStatuses.map((wallet) => (
                <div
                  key={wallet.address}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-gray-600">
                    {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                  </span>
                  <span className="text-xs capitalize">{wallet.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conditional Components */}
      {primaryWallet && primaryWalletDelegationStatus?.status === "pending" && (
        <DelegatedAccessInit />
      )}
      {primaryWallet &&
        primaryWalletDelegationStatus?.status === "delegated" && (
          <DelegatedAccessMethods />
        )}
    </div>
  );
}
