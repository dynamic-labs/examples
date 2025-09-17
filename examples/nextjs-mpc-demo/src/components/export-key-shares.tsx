import { useState } from "react";
import {
  isDynamicWaasConnector,
  Wallet,
} from "@dynamic-labs/wallet-connector-core";

interface Props {
  wallet: Wallet;
}

export default function ExportKeyShares({ wallet }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [exportedKeyShares, setExportedKeyShares] = useState<string>("");

  const handleExportKeyShares = async () => {
    if (!wallet?.address) {
      setErrorMessage("Please create a wallet first");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const connector = wallet?.connector;
      if (!isDynamicWaasConnector(connector)) return;
      const keyShares = await connector.exportClientKeyshares({
        accountAddress: wallet.address,
      });

      setExportedKeyShares(JSON.stringify(keyShares, null, 2));
    } catch (error: any) {
      console.error("Error exporting key shares:", error);
      setErrorMessage(`Error exporting key shares: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Export Key Shares</h2>
      <button onClick={handleExportKeyShares} disabled={isLoading}>
        Export Key Shares
      </button>
      {exportedKeyShares && (
        <div className="output">
          <pre>{exportedKeyShares}</pre>
        </div>
      )}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
}
