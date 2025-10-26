// Pods/Deframe API client

const PODS_API_BASE =
  process.env.NEXT_PUBLIC_PODS_API_URL || "https://api.deframe.io";
const PODS_API_KEY = process.env.NEXT_PUBLIC_PODS_API_KEY;

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

// Response structure for GET /strategies/:id
export interface StrategyDetailResponse {
  spotPosition: {
    apy: number;
    inceptionApy: number;
    avgApy: number;
  };
  strategy: Strategy;
}

// Interfaces for wallet positions
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
}

export interface WalletPositions {
  address: string;
  positions: Position[];
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

export class PodsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!PODS_API_KEY) {
      throw new Error(
        "NEXT_PUBLIC_PODS_API_KEY is not set in environment variables"
      );
    }
    this.apiKey = PODS_API_KEY;
    this.baseUrl = PODS_API_BASE;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pods API error: ${error}`);
    }

    return response.json();
  }

  // Get all available strategies
  async getStrategies(
    chainId?: number,
    limit?: number
  ): Promise<StrategiesResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.set("limit", limit.toString());

    const endpoint = `/strategies${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await this.fetch<StrategiesResponse>(endpoint);
    console.log("response pods", response);

    // Filter by chainId if provided
    if (chainId) {
      return {
        ...response,
        data: response.data.filter(
          (strategy) => parseInt(strategy.networkId) === chainId
        ),
      };
    }

    return response;
  }

  // Get a specific strategy by ID
  async getStrategy(strategyId: string): Promise<Strategy> {
    const endpoint = `/strategies/${strategyId}`;
    const response = await this.fetch<StrategyDetailResponse>(endpoint);
    // Merge spotPosition into the strategy object for convenience
    return {
      ...response.strategy,
      spotPosition: response.spotPosition,
    };
  }

  // Get bytecode for a deposit transaction
  async getDepositBytecode(params: {
    strategyId: string;
    chainId: number;
    amount: string; // Amount in smallest unit (with decimals)
    asset: string;
    wallet: string;
  }): Promise<BytecodeResponse> {
    const { strategyId, chainId, amount, asset, wallet } = params;

    const queryParams = new URLSearchParams({
      action: "lend",
      chainId: chainId.toString(),
      amount,
      asset,
      wallet,
    });

    const endpoint = `/strategies/${strategyId}/bytecode?${queryParams.toString()}`;
    return this.fetch<BytecodeResponse>(endpoint);
  }

  // Get bytecode for a withdraw transaction
  async getWithdrawBytecode(params: {
    strategyId: string;
    chainId: number;
    amount: string; // Amount in smallest unit (with decimals)
    asset: string;
    wallet: string;
  }): Promise<BytecodeResponse> {
    const { strategyId, chainId, amount, asset, wallet } = params;

    const queryParams = new URLSearchParams({
      action: "withdraw",
      chainId: chainId.toString(),
      amount,
      asset,
      wallet,
    });

    const endpoint = `/strategies/${strategyId}/bytecode?${queryParams.toString()}`;
    return this.fetch<BytecodeResponse>(endpoint);
  }

  // Get yield strategies for a specific currency (protocol-agnostic)
  async getYieldStrategies(params: {
    currency: string;
    chainId: number;
    action?: "lend" | "withdraw";
    amount?: string;
    asset?: string;
    wallet?: string;
  }): Promise<Strategy | BytecodeResponse> {
    const { currency, chainId, action, amount, asset, wallet } = params;

    const queryParams = new URLSearchParams({
      chainId: chainId.toString(),
    });

    if (action) queryParams.set("action", action);
    if (amount) queryParams.set("amount", amount);
    if (asset) queryParams.set("asset", asset);
    if (wallet) queryParams.set("wallet", wallet);

    const endpoint = `/yield/${currency}?${queryParams.toString()}`;

    // Return type depends on whether action is specified
    if (action === "lend" || action === "withdraw") {
      return this.fetch<BytecodeResponse>(
        endpoint
      ) as Promise<BytecodeResponse>;
    } else {
      return this.fetch<Strategy>(endpoint) as Promise<Strategy>;
    }
  }

  // Get open positions for a wallet
  async getWalletPositions(address: string): Promise<WalletPositions> {
    const endpoint = `/wallets/${address}`;
    return this.fetch<WalletPositions>(endpoint);
  }
}

export const client = new PodsClient();
