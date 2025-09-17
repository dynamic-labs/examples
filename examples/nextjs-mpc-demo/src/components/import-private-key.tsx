import { useState } from "react";
import { Wallet } from "@dynamic-labs/wallet-connector-core";
import { ChainEnum, useDynamicWaas } from "@dynamic-labs/sdk-react-core";

interface Props {
  wallet: Wallet;
}

export default function ImportPrivateKey({ wallet }: Props) {
  const { importPrivateKey } = useDynamicWaas();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [privateKeyInput, setPrivateKeyInput] = useState<string>("");

  const handleImportPrivateKey = async () => {
    if (!privateKeyInput || !wallet?.address) {
      setErrorMessage(
        "Please enter a private key and ensure wallet is created"
      );
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      await importPrivateKey({
        chainName: ChainEnum.Evm,
        privateKey: privateKeyInput,
      });
      setPrivateKeyInput("");
      setErrorMessage("Private key imported successfully");
    } catch (error: any) {
      console.error("Error importing private key:", error);
      setErrorMessage(`Error importing private key: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Import Private Key</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="text"
          value={privateKeyInput}
          onChange={(e) => setPrivateKeyInput(e.target.value)}
          placeholder="Enter private key"
          className="input"
        />
        <button onClick={handleImportPrivateKey} disabled={isLoading}>
          Import Private Key
        </button>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
    </div>
  );
}
