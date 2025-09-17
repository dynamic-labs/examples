import { useEffect, useState } from "react";
import { Wallet } from "@dynamic-labs/wallet-connector-core";
import {
  ChainEnum,
  useDynamicWaas,
  useSwitchWallet,
  useUserWallets,
} from "@dynamic-labs/sdk-react-core";

interface Props {
  wallet: Wallet | null;
}

export default function CreateMpcWallet({ wallet }: Props) {
  const { createWalletAccount } = useDynamicWaas();
  const switchWallet = useSwitchWallet();
  const userWallets = useUserWallets();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [newWallet, setNewWallet] = useState<string | null>(null);

  useEffect(() => {
    if (!newWallet) return;
    const newWalletId = userWallets.find(
      (wallet) => wallet.address === newWallet
    )?.id;
    if (newWalletId) switchWallet(newWalletId);
    setNewWallet(null);
    console.log("userWallets", userWallets);
  }, [userWallets]);

  const handleCreateWallet = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const newWallet = await createWalletAccount([ChainEnum.Evm]);
      if (!newWallet || !newWallet[0]) return;

      setNewWallet(newWallet[0].accountAddress);
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      setErrorMessage(`Error creating wallet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create MPC Wallet</h2>
      <button onClick={handleCreateWallet} disabled={isLoading}>
        Create New Wallet
      </button>

      {wallet?.address && (
        <div>
          <p>Wallet Address:</p>
          <div className="address">{wallet?.address}</div>
        </div>
      )}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
}
