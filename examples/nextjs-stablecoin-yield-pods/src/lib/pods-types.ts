// Type definitions for Deframe Pods API

export interface Strategy {
  asset: string;
  protocol: string;
  assetName: string;
  network: string;
  networkId: string;
  implementationSelector: string;
  startDate: string;
  underlyingAsset: string;
  assetDecimals: number;
  underlyingDecimals: number;
  isActive?: boolean;
  id: string;
  fee: string;
  metadata?: {
    PT?: {
      risk: string;
      volatility: string;
      description: string;
    };
    EN?: {
      risk: string;
      volatility: string;
      description: string;
    };
    category?: string;
    [key: string]: unknown;
  };
  logourl?: string;
  // Optional APY fields that may be returned by the API
  spotPosition?: {
    apy: number;
    inceptionApy: number;
    avgApy: number;
  };
}

export interface TokenInfo {
  address: string;
  decimals: string;
  symbol: string;
  name: string;
}

export interface Balance {
  raw: string;
  humanized: number;
  decimals: string;
}

export interface Reward {
  token: {
    address: string;
    symbol: string;
    decimals: string;
  };
  amount: string;
  amountUSD: string;
}

export interface Position {
  protocol: string;
  asset: TokenInfo;
  balance: Balance;
  balanceUSD: string;
  apy: string;
  rewards: Reward[];
  strategyId?: string;
}

export interface WalletPositions {
  address: string;
  positions: Position[];
}

// Internal response types for PodsClient
export interface StrategyDetailResponse {
  spotPosition: {
    apy: number;
    inceptionApy: number;
    avgApy: number;
  };
  strategy: Strategy;
}

export interface BytecodeResponse {
  bytecode: Array<{
    to: string;
    value: string;
    data: string;
  }>;
}

export interface StrategiesResponse {
  data: Strategy[];
  pagination: {
    totalRecords: number;
    limit: number;
    totalPages: number;
    page: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

// Transaction operation types
export interface TransactionCall {
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
}

// Component prop types
export interface PositionCardProps {
  position: Position;
  isOperating: boolean;
  onWithdraw: (position: Position, amount: string) => void;
}

export interface StrategyCardProps {
  strategy: Strategy;
  isOperating: boolean;
  primaryWallet: { address: string } | null;
  onDeposit: (strategy: Strategy, amount: string) => void;
  onWithdraw: (strategy: Strategy, amount: string) => void;
}

// Raw API response types (before normalization)
export interface RawPosition {
  spotPosition?: {
    currentPosition?: {
      decimals?: string | number;
      humanized?: number | string;
      value?: string;
      asset?: string;
    };
    underlyingBalanceUSD?: string;
    apy?: string | number;
  };
  strategy?: {
    protocol?: string;
    asset?: string;
    underlyingAsset?: string;
    assetName?: string;
    assetDecimals?: number;
    id?: string;
  };
  rewards?: Reward[];
}

export interface RawWalletPositions {
  positions?: RawPosition[];
}

