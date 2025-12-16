"use client";

import { useDynamicModals, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState } from "react";
import DynamicActiveWallet from "@/components/dynamic/dynamic-active-wallet";
import DynamicAuthButton from "@/components/dynamic/dynamic-auth-button";
import DynamicWalletList from "@/components/dynamic/dynamic-wallet-list";
import { Button } from "@/components/ui/button";

/**
 * Main Page - External Wallet Management
 *
 * Demonstrates Dynamic SDK's multi-wallet functionality:
 * - Login/logout with external wallets (connect-and-sign)
 * - Link additional wallets to the same account
 * - View and manage all connected wallets
 * - Switch between wallets and networks
 */
export default function Main() {
  // Dynamic SDK hooks for modal control and auth state
  const { setShowLinkNewWalletModal } = useDynamicModals();
  const isLoggedIn = useIsLoggedIn();

  // Track client-side mount to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Login/Logout button */}
        <DynamicAuthButton />

        {/* Only show wallet management UI after mount (to prevent hydration issues) and when logged in */}
        {mounted && isLoggedIn && (
          <>
            {/* Opens Dynamic's wallet linking modal */}
            <Button onClick={() => setShowLinkNewWalletModal(true)}>
              Link New Wallet
            </Button>

            {/* Shows the currently active (primary) wallet with network selector */}
            <DynamicActiveWallet />

            {/* Shows all wallets linked to this account */}
            <DynamicWalletList />
          </>
        )}
      </div>
    </div>
  );
}
