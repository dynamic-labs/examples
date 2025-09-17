import { BankAccount } from "@/types";

interface BlockchainWallet {
  id: string;
  name: string;
  network: string;
  address: string;
  is_account_abstraction: boolean;
  created_at: string;
}

export class PaymentMethodsService {
  static async getBankAccounts(receiverId: string): Promise<BankAccount[]> {
    const response = await fetch(`/api/payment-methods/bank-accounts?receiverId=${receiverId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch bank accounts");
    }
    
    const data = await response.json();
    if (!data.success || !data.bankAccounts?.length) {
      throw new Error("No bank accounts found");
    }
    
    return data.bankAccounts;
  }

  static async getBlockchainWallets(receiverId: string): Promise<BlockchainWallet[]> {
    const response = await fetch(`/api/payment-methods/blockchain-wallets?receiverId=${receiverId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch blockchain wallets");
    }
    
    const data = await response.json();
    if (!data.success || !data.blockchainWallets?.length) {
      throw new Error("No blockchain wallets found");
    }
    
    return data.blockchainWallets;
  }

  static async checkPaymentMethods(receiverId: string): Promise<{
    hasBankAccounts: boolean;
    hasBlockchainWallets: boolean;
    hasAnyPaymentMethod: boolean;
  }> {
    try {
      const [bankAccounts, blockchainWallets] = await Promise.all([
        this.getBankAccounts(receiverId).catch(() => []),
        this.getBlockchainWallets(receiverId).catch(() => []),
      ]);

      const hasBankAccounts = bankAccounts.length > 0;
      const hasBlockchainWallets = blockchainWallets.length > 0;
      const hasAnyPaymentMethod = hasBankAccounts || hasBlockchainWallets;

      return {
        hasBankAccounts,
        hasBlockchainWallets,
        hasAnyPaymentMethod,
      };
    } catch {
      return {
        hasBankAccounts: false,
        hasBlockchainWallets: false,
        hasAnyPaymentMethod: false,
      };
    }
  }
}

