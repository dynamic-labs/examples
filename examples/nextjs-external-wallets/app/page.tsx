"use client";

import { useUser } from "@dynamic-labs-sdk/react-hooks";
import DynamicActiveWallet from "@/components/dynamic/dynamic-active-wallet";
import DynamicAuthButton from "@/components/dynamic/dynamic-auth-button";
import DynamicWalletList from "@/components/dynamic/dynamic-wallet-list";

/**
 * Main Page - Embedded Wallet Management
 *
 * Demonstrates Dynamic JS SDK's embedded (MPC/WaaS) wallet functionality:
 * - Login/logout with Google or Email OTP
 * - Auto-created EVM and Solana embedded wallets
 * - View active wallet and all wallet accounts
 */
export default function Main() {
  const user = useUser();
  const isLoggedIn = user !== null;

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Login/Logout button */}
        <DynamicAuthButton />

        {/* Show wallet management UI when logged in */}
        {isLoggedIn && (
          <>
            {/* Shows the currently active embedded wallet */}
            <DynamicActiveWallet />

            {/* Shows all embedded wallet accounts */}
            <DynamicWalletList />
          </>
        )}
      </div>
    </div>
  );
}
