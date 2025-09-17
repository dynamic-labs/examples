import { useState } from "react";
import { Wallet } from "@dynamic-labs/wallet-connector-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

interface Props {
  wallet: Wallet;
}

export default function SignMessage({ wallet }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [signedMessage, setSignedMessage] = useState<string>("");

  const handleSignMessage = async () => {
    if (!isEthereumWallet(wallet)) {
      setErrorMessage("Please create a wallet first");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      const provider = await wallet.getWalletClient();

      const message = "Hello, world!";
      const signature = await provider?.signMessage({ message });
      setSignedMessage(signature ?? "");
    } catch (error: any) {
      console.error("Error signing message:", error);
      setErrorMessage(`Error signing message: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Sign Message</h2>
      <button onClick={handleSignMessage} disabled={isLoading}>
        Sign Message
      </button>
      {signedMessage && (
        <div
          className="output"
          style={{
            maxWidth: "300px",
            wordBreak: "break-all",
            textAlign: "left",
          }}
        >
          <pre style={{ whiteSpace: "pre-wrap" }}>{signedMessage}</pre>
        </div>
      )}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
}
