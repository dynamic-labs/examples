"use client";

/**
 * Wallet Application Client Component
 *
 * This client component handles all Dynamic SDK interactions.
 * It's separated from the page to allow the page shell to render
 * immediately as a server component.
 *
 * App flow:
 * 1. Initialize Dynamic client (fast - no network request)
 * 2. Check existing auth state from localStorage
 * 3. Render appropriate screen based on auth status
 *
 * Key patterns:
 * - useAuth() reactively subscribes to Dynamic SDK auth events
 * - useNavigation() manages screen state with auto-redirects based on auth
 * - Screen components receive navigation object for screen transitions
 */

import { useAuth } from "@/hooks/use-auth";
import { useNavigation } from "@/hooks/use-navigation";
import { useClientInitialized } from "@/hooks/use-client-initialized";
import { WidgetCard } from "@/components/ui/widget-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AuthScreen } from "@/components/screens/auth-screen";
import { OtpVerifyScreen } from "@/components/screens/otp-verify-screen";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { SendTxScreen } from "@/components/screens/send-tx-screen";

export function WalletApp() {
  const isClientReady = useClientInitialized();
  const isLoggedIn = useAuth();
  const navigation = useNavigation(isLoggedIn);
  const { screen, isReady, isTransitioning } = navigation;

  // Show loading until SDK initialized and screen matches auth state
  if (!isClientReady || !isReady) {
    return (
      <WidgetCard>
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </WidgetCard>
    );
  }

  return (
    <div
      className={`transition-opacity duration-150 ${
        isTransitioning ? "opacity-50" : "opacity-100"
      }`}
    >
      {screen.type === "auth" && <AuthScreen navigation={navigation} />}

      {screen.type === "otp-verify" && (
        <OtpVerifyScreen
          email={screen.email}
          otpVerification={screen.otpVerification}
          navigation={navigation}
        />
      )}

      {screen.type === "dashboard" && (
        <DashboardScreen navigation={navigation} />
      )}

      {(screen.type === "send-tx" || screen.type === "tx-result") && (
        <SendTxScreen
          walletAddress={screen.type === "send-tx" ? screen.walletAddress : ""}
          chain={screen.type === "send-tx" ? screen.chain : ""}
          navigation={navigation}
          txResult={
            screen.type === "tx-result"
              ? { txHash: screen.txHash, networkData: screen.networkData }
              : undefined
          }
        />
      )}
    </div>
  );
}
