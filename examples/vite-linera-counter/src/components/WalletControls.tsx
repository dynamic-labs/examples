import { useUser, useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { logout } from "@dynamic-labs-sdk/client";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { dynamicClient } from "../lib/dynamic";

function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletControls() {
  const user = useUser();
  const { walletAccounts } = useWalletAccounts();
  const isLoggedIn = user !== null;

  const primaryWallet = walletAccounts?.find(isEvmWalletAccount);
  const address = primaryWallet?.address || "";

  return (
    <div className="wallet-controls">
      {isLoggedIn && address ? (
        <>
          <span className="wallet-address">{shortenAddress(address)}</span>
          <button className="docs-button" onClick={() => logout(dynamicClient)}>
            Disconnect
          </button>
        </>
      ) : (
        <button
          className="get-started"
          onClick={() => dynamicClient.ui.auth.show()}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
