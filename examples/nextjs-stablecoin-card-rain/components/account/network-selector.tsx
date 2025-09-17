"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useDynamicContext } from "@/lib/dynamic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountModalProps {
  currentNetwork: {
    id: string;
    name: string;
    iconUrl: string | undefined;
  };
}

export default function NetworkSelector({ currentNetwork }: AccountModalProps) {
  const { primaryWallet } = useDynamicContext();
  const enabledNetworks = primaryWallet?.connector.getEnabledNetworks();
  const [switchingToNetworkId, setSwitchingToNetworkId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNetworkSwitch = async (networkId: string | number) => {
    if (!primaryWallet?.connector.supportsNetworkSwitching()) return;
    if (isLoading) return; // Prevent multiple simultaneous attempts

    const networkIdString = String(networkId);

    // Don't switch if already on the target network
    if (currentNetwork.id === networkIdString) return;

    setSwitchingToNetworkId(networkIdString);
    setIsLoading(true);

    try {
      await primaryWallet.switchNetwork(networkId);
      // Switch completed successfully
    } catch (error) {
      console.error("Network switch failed:", error);
      // Optionally show user-friendly error message
    } finally {
      setSwitchingToNetworkId(null);
      setIsLoading(false);
    }
  };

  // Get available networks from Dynamic SDK
  const availableNetworks = useMemo(() => {
    if (!primaryWallet || !enabledNetworks || enabledNetworks.length === 0) {
      return [];
    }

    return enabledNetworks.map((networkConfig) => ({
      id: String(networkConfig.chainId || networkConfig.networkId),
      name: networkConfig.vanityName || networkConfig.name,
      iconUrl: networkConfig.iconUrls?.[0] as string | undefined,
    }));
  }, [primaryWallet, enabledNetworks]);

  if (!primaryWallet?.connector.supportsNetworkSwitching()) return null;
  return (
    <>
      <div className="border-t -mx-6" />
      <div className="pt-2 -mt-3 -mb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Network</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm hover:bg-accent cursor-pointer">
                {currentNetwork.iconUrl ? (
                  <img
                    src={currentNetwork.iconUrl}
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <span className="inline-block w-3 h-3 rounded-full bg-white/30" />
                )}
                <span className="truncate max-w-[140px] text-left">
                  {currentNetwork.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {availableNetworks.map((net) => {
                const isSwitchingToThis =
                  switchingToNetworkId === net.id && isLoading;
                const isCurrentNetwork = currentNetwork.id === net.id;

                return (
                  <DropdownMenuItem
                    key={net.id}
                    onClick={() => handleNetworkSwitch(net.id)}
                    className={`flex items-center gap-2 cursor-pointer ${
                      isLoading && !isSwitchingToThis
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    } ${isCurrentNetwork ? "bg-accent" : ""}`}
                    disabled={isLoading && !isSwitchingToThis}
                  >
                    {net.iconUrl ? (
                      <img
                        src={net.iconUrl}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <span className="inline-block w-3 h-3 rounded-full bg-white/30" />
                    )}
                    <span className="truncate">{net.name}</span>
                    {isSwitchingToThis && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Switching...
                      </span>
                    )}
                    {isCurrentNetwork && !isSwitchingToThis && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Current
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
