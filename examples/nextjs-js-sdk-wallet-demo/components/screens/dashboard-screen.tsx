"use client";

import { LogOut, Wallet } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScrollableWalletList } from "@/components/wallet/scrollable-wallet-list";
import { CreateWalletButtons } from "@/components/wallet/create-wallet-buttons";
import { useWalletAccounts } from "@/hooks/use-wallet-accounts";
import { useLogout } from "@/hooks/use-mutations";
import { getUniqueWalletAddresses } from "@/lib/wallet-utils";
import type { NavigationReturn } from "@/hooks/use-navigation";

interface DashboardScreenProps {
  navigation: NavigationReturn;
}

/**
 * Dashboard screen showing wallet list and create options
 */
export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { walletAccounts, isLoading } = useWalletAccounts();
  const logoutMutation = useLogout();

  const uniqueWallets = getUniqueWalletAddresses(walletAccounts);

  const handleLogout = () => logoutMutation.mutateAsync();

  const handleSend = (address: string, chain: string) => {
    navigation.goToSendTx(address, chain);
  };

  const handleAuthorize = (address: string) => {
    // Go directly to send-tx - it handles authorization if needed
    navigation.goToSendTx(address, "EVM");
  };

  const handleSetupMfa = (address: string, chain: string) => {
    navigation.goToSetupMfa(address, chain);
  };

  const handleRowClick = (
    address: string,
    chain: string,
    networkId: number,
  ) => {
    navigation.goToTxHistory(address, chain, networkId);
  };

  return (
    <WidgetCard
      icon={
        <Wallet
          className="w-[18px] h-[18px] text-(--widget-fg)"
          strokeWidth={1.5}
        />
      }
      title="Your Wallets"
      subtitle="Manage your embedded wallets"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <ScrollableWalletList
            wallets={uniqueWallets}
            onSend={handleSend}
            onAuthorize={handleAuthorize}
            onSetupMfa={handleSetupMfa}
            onRowClick={handleRowClick}
          />
        )}

        <div className="h-px bg-(--widget-border)" />

        <div className="flex items-center gap-2">
          <CreateWalletButtons className="flex-1" />
          <Button
            variant="outline"
            size="icon"
            danger
            onClick={handleLogout}
            loading={logoutMutation.isPending}
            aria-label="Sign out"
            title="Sign out"
          >
            {!logoutMutation.isPending && <LogOut className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </WidgetCard>
  );
}
