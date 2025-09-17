import { useDynamicContext } from "@/lib/dynamic";
import { useState, useEffect } from "react";
import {
  useRefreshUser,
  useUserUpdateRequest,
} from "@dynamic-labs/sdk-react-core";

interface UserMetadata {
  blindpayReceiverId?: string;
  blindpayBankingId?: string;
  [key: string]: unknown;
}

export function useKYCStatus() {
  const { user, primaryWallet } = useDynamicContext();
  const { updateUser } = useUserUpdateRequest();
  const refreshUser = useRefreshUser();
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [bankingId, setBankingId] = useState<string | null>(null);
  const [isKYCComplete, setIsKYCComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAndRefreshUser = async () => {
      if (user && user.metadata) {
        const metadata = user.metadata as UserMetadata;
        const blindpayReceiverId = metadata.blindpayReceiverId;
        const blindpayBankingId = metadata.blindpayBankingId;

        if (blindpayReceiverId) {
          setReceiverId(blindpayReceiverId);
          setIsKYCComplete(true);
        } else {
          setIsKYCComplete(false);
          // Refresh user if there's no receiver ID to get latest metadata
          try {
            await refreshUser();
          } catch (error) {
            console.warn("Failed to refresh user:", error);
          }
        }

        if (blindpayBankingId) {
          setBankingId(blindpayBankingId);
        }
      } else {
        setIsKYCComplete(false);
        // Refresh user if there's no user or metadata
        if (user) {
          try {
            await refreshUser();
          } catch (error) {
            console.warn("Failed to refresh user:", error);
          }
        }
      }

      setIsLoading(false);
    };

    checkAndRefreshUser();
  }, [user, refreshUser]);

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
      // Update local state_province_region
      setReceiverId(newReceiverId);
      setIsKYCComplete(true);

      // Store in Dynamic user metadata
      const metadata = (user?.metadata as UserMetadata) || {};
      const updatedMetadata = {
        ...metadata,
        blindpayReceiverId: newReceiverId,
      };

      // Use Dynamic's updateUser to store in metadata
      const result = await updateUser({
        metadata: updatedMetadata,
      });

      if (
        result.isEmailVerificationRequired ||
        result.isSmsVerificationRequired
      ) {
        return true;
      }

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

      const result = await updateUser({
        metadata: updatedMetadata,
      });

      if (
        result.isEmailVerificationRequired ||
        result.isSmsVerificationRequired
      ) {
        return true;
      }

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

      const result = await updateUser({
        metadata: updatedMetadata,
      });

      if (
        result.isEmailVerificationRequired ||
        result.isSmsVerificationRequired
      ) {
        setReceiverId(newReceiverId);
        setBankingId(newBankingId);
        setIsKYCComplete(true);
        return true;
      }

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
      const updatedMetadata = {
        ...metadata,
        blindpayReceiverId: undefined,
        blindpayBankingId: undefined,
      };

      delete updatedMetadata.blindpayReceiverId;
      delete updatedMetadata.blindpayBankingId;

      await updateUser({
        metadata: updatedMetadata,
      });
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
