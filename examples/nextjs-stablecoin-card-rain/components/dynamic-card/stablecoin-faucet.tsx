"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Droplets, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMintTokens } from "@/hooks/use-mint-tokens";
import { useDynamicContext } from "@/lib/dynamic";
import { getContractAddress } from "@/constants";
import WalletBalanceDisplay from "./wallet-balance-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTokenBalanceContext } from "./token-balance-context";

export default function StablecoinFaucet() {
  const { refetch: refetchBalances } = useTokenBalanceContext();

  const [fundingWallet, setFundingWallet] = useState(false);
  const { network } = useDynamicContext();

  const rusdcAddress = useMemo(() => {
    if (!network) return undefined;
    return getContractAddress(network, "RUSDC");
  }, [network]);

  const { mintTokens, resetMint, isPending } = useMintTokens({
    onMintSuccess: () => {
      setFundingWallet(false);
      refetchBalances(true);
      resetMint();
    },
    onMintError: () => setFundingWallet(false),
  });

  const handleFundWallet = () => {
    setFundingWallet(true);
    mintTokens({ amountDollars: 100 });
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between flex-1">
        <WalletBalanceDisplay
          tokenAddress={rusdcAddress || ""}
          showUSDC={false}
          className="flex flex-col"
          balanceClassName="text-xl font-semibold"
          refreshIconSize="md"
        />
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              onClick={handleFundWallet}
              variant="outline"
              size="sm"
              disabled={isPending || fundingWallet}
              className="shrink-0 h-7 px-2 text-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Topping up...
                </>
              ) : (
                <>
                  Get USDC
                  <ArrowRight className="h-2 w-2 ml-1" />
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Receive 100 USDC for testing</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
