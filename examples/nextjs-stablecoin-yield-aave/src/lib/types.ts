// Custom types for the application
export interface Currency {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface Chain {
  chainId: number;
  name: string;
  icon?: string;
  explorerUrl?: string;
  isTestnet?: boolean;
  nativeWrappedToken?: string;
}

// Wallet types
export interface PrimaryWallet {
  address: string;
}

export type PrimaryWalletOrNull = PrimaryWallet | null;

// Transaction type
export interface Transaction {
  type: string;
  hash: string;
  timestamp: number;
}
