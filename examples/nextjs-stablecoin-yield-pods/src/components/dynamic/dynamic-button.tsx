"use client";

import {
  DynamicConnectButton,
  useDynamicContext,
  useIsLoggedIn,
} from "@/lib/dynamic";
import { Button } from "@/components/ui/button";

export default function DynamicButton() {
  const isLoggedIn = useIsLoggedIn();
  const { primaryWallet, setShowDynamicUserProfile } = useDynamicContext();

  if (isLoggedIn && primaryWallet?.address) {
    const address = primaryWallet.address;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <Button
        variant="outline"
        onClick={() => setShowDynamicUserProfile(true)}
        className="flex items-center gap-2 border-[#DADADA] bg-white px-3 py-1.5 text-sm font-medium text-[#030303] hover:bg-[#F9F9F9]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4779FF] text-xs font-bold text-white">
          {address.slice(2, 4).toUpperCase()}
        </span>
        {shortAddress}
      </Button>
    );
  }

  return (
    <DynamicConnectButton buttonClassName="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-[#4779FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4779FF]/90">
      Sign in
    </DynamicConnectButton>
  );
}
