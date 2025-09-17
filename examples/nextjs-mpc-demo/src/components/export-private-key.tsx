import { useState, useRef } from "react";
import {
  isDynamicWaasConnector,
  Wallet,
} from "@dynamic-labs/wallet-connector-core";

interface Props {
  wallet: Wallet;
}

export default function ExportPrivateKey({ wallet }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const displayContainerRef = useRef<HTMLIFrameElement>(null);

  const exportPrivateKey = async () => {
    if (!wallet || !displayContainerRef.current) return;
    displayContainerRef.current.innerHTML = "";

    if (!isDynamicWaasConnector(wallet?.connector)) {
      return;
    }

    setIsLoading(true);
    try {
      await wallet?.connector.exportPrivateKey({
        accountAddress: wallet.address,
        displayContainer: displayContainerRef.current,
      });
    } catch (error) {
      console.error("Error exporting private key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Export Private Key</h2>
      <button onClick={exportPrivateKey} disabled={isLoading}>
        {isLoading ? "Exporting..." : "Export Private Key"}
      </button>
      <div
        ref={displayContainerRef}
        style={{
          width: "100%",
          border: "1px solid #ccc",
          borderRadius: "8px",
          marginTop: "16px",
          maxHeight: "40px",
          maxWidth: "420px",
          padding: "9px",
          ...(!displayContainerRef.current?.innerHTML && {
            display: "none",
          }),
        }}
        className="export-container"
      />
      <style>{`
          .export-container iframe {
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            border-radius: 8px !important;
          }
        `}</style>
    </div>
  );
}
