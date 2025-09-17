import { useState, useEffect, useCallback } from "react";
import { PaymentMethodsService } from "@/lib/services/paymentMethodsService";
import { BankAccount } from "@/types";

interface BlockchainWallet {
  id: string;
  name: string;
  network: string;
  address: string;
  is_account_abstraction: boolean;
  created_at: string;
}

export function usePaymentMethods(receiverId: string | null) {
  const [hasPaymentMethods, setHasPaymentMethods] = useState(false);
  const [hasBankAccounts, setHasBankAccounts] = useState(false);
  const [hasBlockchainWallets, setHasBlockchainWallets] = useState(false);
  const [availableBankAccounts, setAvailableBankAccounts] = useState<
    BankAccount[]
  >([]);
  const [availableBlockchainWallets, setAvailableBlockchainWallets] = useState<
    BlockchainWallet[]
  >([]);

  const checkPaymentMethods = useCallback(async () => {
    if (!receiverId) return false;

    try {
      const result = await PaymentMethodsService.checkPaymentMethods(
        receiverId
      );

      setHasPaymentMethods(result.hasAnyPaymentMethod);
      setHasBankAccounts(result.hasBankAccounts);
      setHasBlockchainWallets(result.hasBlockchainWallets);

      if (result.hasBankAccounts) {
        const bankAccounts = await PaymentMethodsService.getBankAccounts(
          receiverId
        );
        setAvailableBankAccounts(bankAccounts);
      }

      if (result.hasBlockchainWallets) {
        const wallets = await PaymentMethodsService.getBlockchainWallets(
          receiverId
        );
        setAvailableBlockchainWallets(wallets);
      }

      return result.hasAnyPaymentMethod;
    } catch {
      setHasPaymentMethods(false);
      setHasBankAccounts(false);
      setHasBlockchainWallets(false);
      return false;
    }
  }, [receiverId]);

  useEffect(() => {
    if (receiverId) {
      checkPaymentMethods();
    }
  }, [receiverId, checkPaymentMethods]);

  return {
    hasPaymentMethods,
    hasBankAccounts,
    hasBlockchainWallets,
    availableBankAccounts,
    availableBlockchainWallets,
    checkPaymentMethods,
  };
}
