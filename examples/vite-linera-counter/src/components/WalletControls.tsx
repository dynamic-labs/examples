import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";

function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletControls() {
  const { sdkHasLoaded, primaryWallet, setShowAuthFlow, handleLogOut } =
    useDynamicContext();
  const isLoggedIn = useIsLoggedIn();

  if (!sdkHasLoaded) return null;

  const address = primaryWallet?.address || "";

  return (
    <div className="wallet-controls">
      {isLoggedIn && address ? (
        <>
          <span className="wallet-address">{shortenAddress(address)}</span>
          <button className="docs-button" onClick={handleLogOut}>
            Disconnect
          </button>
        </>
      ) : (
        <button className="get-started" onClick={() => setShowAuthFlow(true)}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
