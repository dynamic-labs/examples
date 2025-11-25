import type {
  Strategy,
  Position,
  WalletPositions,
  StrategyDetailResponse,
  BytecodeResponse,
  StrategiesResponse,
  RawPosition,
  RawWalletPositions,
} from "./pods-types";

const PODS_API_BASE =
  process.env.NEXT_PUBLIC_PODS_API_URL || "https://api.deframe.io";
const PODS_API_KEY = process.env.NEXT_PUBLIC_PODS_API_KEY;

if (!PODS_API_KEY) {
  throw new Error(
    "NEXT_PUBLIC_PODS_API_KEY is not set in environment variables"
  );
}

async function fetchFromPodsAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PODS_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": PODS_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pods API error: ${error}`);
  }

  return response.json();
}

export async function getStrategies(
  chainId?: number,
  limit?: number
): Promise<StrategiesResponse> {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.set("limit", limit.toString());

  const endpoint = `/strategies${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
  const response = await fetchFromPodsAPI<StrategiesResponse>(endpoint);

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

export async function getStrategy(strategyId: string): Promise<Strategy> {
  const endpoint = `/strategies/${strategyId}`;
  const response = await fetchFromPodsAPI<StrategyDetailResponse>(endpoint);
  return {
    ...response.strategy,
    spotPosition: response.spotPosition,
  };
}

export async function getDepositBytecode(params: {
  strategyId: string;
  chainId: number;
  amount: string;
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
  return fetchFromPodsAPI<BytecodeResponse>(endpoint);
}

export async function getWithdrawBytecode(params: {
  strategyId: string;
  chainId: number;
  amount: string;
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
  return fetchFromPodsAPI<BytecodeResponse>(endpoint);
}

export async function getYieldStrategies(params: {
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

  if (action === "lend" || action === "withdraw") {
    return fetchFromPodsAPI<BytecodeResponse>(
      endpoint
    ) as Promise<BytecodeResponse>;
  } else {
    return fetchFromPodsAPI<Strategy>(endpoint) as Promise<Strategy>;
  }
}

export async function getWalletPositions(
  address: string
): Promise<WalletPositions> {
  const endpoint = `/wallets/${address}`;
  const raw = await fetchFromPodsAPI<RawWalletPositions>(endpoint);

  const mapped: WalletPositions = {
    address,
    positions:
      (raw?.positions || []).map((p: RawPosition) => {
        const spot = p?.spotPosition ?? {};
        const current = spot?.currentPosition ?? {};
        const strat = p?.strategy ?? {};

        const assetDecimals =
          typeof strat?.assetDecimals === "number"
            ? String(strat.assetDecimals)
            : String(current?.decimals ?? "0");

        const balanceHumanized =
          typeof current?.humanized === "number"
            ? current.humanized
            : parseFloat(String(current?.humanized ?? 0));

        const position: Position = {
          protocol: String(strat?.protocol ?? ""),
          asset: {
            address: String(strat?.asset ?? strat?.underlyingAsset ?? ""),
            decimals: assetDecimals,
            symbol: String(strat?.assetName ?? current?.asset ?? ""),
            name: String(strat?.assetName ?? current?.asset ?? ""),
          },
          balance: {
            raw: String(current?.value ?? "0"),
            humanized: isFinite(balanceHumanized) ? balanceHumanized : 0,
            decimals: assetDecimals,
          },
          balanceUSD: String(spot?.underlyingBalanceUSD ?? "0"),
          apy: String(spot?.apy ?? "0"),
          rewards: Array.isArray(p?.rewards) ? p.rewards : [],
          strategyId: String(strat?.id ?? ""),
        };

        return position;
      }) ?? [],
  };

  return mapped;
}

export const client = {
  getStrategies,
  getStrategy,
  getDepositBytecode,
  getWithdrawBytecode,
  getYieldStrategies,
  getWalletPositions,
};
