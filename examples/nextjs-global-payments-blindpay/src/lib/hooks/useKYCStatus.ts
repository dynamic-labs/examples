import { useUser, useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { updateUser } from "@dynamic-labs-sdk/client";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { useState, useEffect } from "react";
import { dynamicClient } from "@/lib/dynamic";

interface UserMetadata {
  blindpayReceiverId?: string;
  blindpayBankingId?: string;
  [key: string]: unknown;
}

export function useKYCStatus() {
  const user = useUser();
  const accounts = useWalletAccounts();
  const primaryWallet = accounts.find(isEvmWalletAccount) ?? null;
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [bankingId, setBankingId] = useState<string | null>(null);
  const [isKYCComplete, setIsKYCComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (user && user.metadata) {
        const metadata = user.metadata as UserMetadata;
        const blindpayReceiverId = metadata.blindpayReceiverId;
        const blindpayBankingId = metadata.blindpayBankingId;

        if (blindpayReceiverId) {
          setReceiverId(blindpayReceiverId);
          setIsKYCComplete(true);
        } else {
          setIsKYCComplete(false);
        }

        if (blindpayBankingId) {
          setBankingId(blindpayBankingId);
        }
      } else {
        setIsKYCComplete(false);
      }

      setIsLoading(false);
    };

    checkUser();
  }, [user]);

  const checkReceiverExists = async (): Promise<boolean> => {
    if (!user?.email) return false;

    try {
      const response = await fetch(
        `/api/receivers?email=${encodeURIComponent(user.email)}&limit=1`
      );
      if (response.ok) {
        const data = await response.json();
        return data.receivers && data.receivers.length > 0;
      }
    } catch {}
    return false;
  };

  const storeReceiverId = async (newReceiverId: string): Promise<boolean> => {
    try {
      setReceiverId(newReceiverId);
      setIsKYCComplete(true);

      const metadata = (user?.metadata as UserMetadata) || {};
      const updatedMetadata = {
        ...metadata,
        blindpayReceiverId: newReceiverId,
      };

      await updateUser(
        { userFields: { metadata: updatedMetadata } },
        dynamicClient
      );

      return true;
    } catch {
      return true;
    }
  };

  const storeBankingId = async (newBankingId: string): Promise<boolean> => {
    try {
      setBankingId(newBankingId);

      const metadata = (user?.metadata as UserMetadata) || {};
      const updatedMetadata = {
        ...metadata,
        blindpayBankingId: newBankingId,
      };

      await updateUser(
        { userFields: { metadata: updatedMetadata } },
        dynamicClient
      );

      return true;
    } catch {
      return true;
    }
  };

  const storeBothIds = async (
    newReceiverId: string,
    newBankingId: string
  ): Promise<boolean> => {
    try {
      const metadata = (user?.metadata as UserMetadata) || {};
      const updatedMetadata = {
        ...metadata,
        blindpayReceiverId: newReceiverId,
        blindpayBankingId: newBankingId,
      };

      await updateUser(
        { userFields: { metadata: updatedMetadata } },
        dynamicClient
      );

      setReceiverId(newReceiverId);
      setBankingId(newBankingId);
      setIsKYCComplete(true);

      return true;
    } catch {
      setReceiverId(newReceiverId);
      setBankingId(newBankingId);
      setIsKYCComplete(true);
      return true;
    }
  };

  const clearBothIds = async (): Promise<void> => {
    try {
      const metadata = (user?.metadata as UserMetadata) || {};
      const updatedMetadata = { ...metadata };
      delete updatedMetadata.blindpayReceiverId;
      delete updatedMetadata.blindpayBankingId;

      await updateUser(
        { userFields: { metadata: updatedMetadata } },
        dynamicClient
      );
    } catch {
    } finally {
      setReceiverId(null);
      setBankingId(null);
      setIsKYCComplete(false);
    }
  };

  return {
    receiverId,
    bankingId,
    isKYCComplete,
    isLoading,
    checkReceiverExists,
    storeReceiverId,
    storeBankingId,
    storeBothIds,
    clearBothIds,
    user,
    primaryWallet,
  };
}
