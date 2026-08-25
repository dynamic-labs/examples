"use client";

import type { ReactNode } from "react";
import {
  chainsMap,
  getOrMapViemChain,
} from "@dynamic-labs/ethereum-core";
import {
  DynamicContextProvider,
  EthereumWalletConnectors,
  mergeNetworks,
  ZeroDevSmartWalletConnectors,
  ZeroDevSmartWalletConnectorsWithConfig,
} from "@/lib/dynamic";

export const dynamicEnvironmentId =
  process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID ?? "";

export const hasDynamicEnvironment = dynamicEnvironmentId.length > 0;

export const zeroDevRpcUrl =
  process.env.NEXT_PUBLIC_ZERODEV_RPC_URL?.trim() ?? "";

const MONAD_MAINNET_NETWORK = {
  blockExplorerUrls: ["https://monadvision.com", "https://monadscan.com"],
  chainId: 143,
  chainName: "Monad Mainnet",
  iconUrls: [],
  name: "Monad Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  networkId: 143,
  rpcUrls: ["https://rpc.monad.xyz"],
  vanityName: "Monad",
};

const monadMainnetChain = getOrMapViemChain(MONAD_MAINNET_NETWORK);

// Dynamic 4.53.1's viem chain map includes Monad Testnet (10143), but not
// Monad mainnet (143). ZeroDev reads this map when creating its Kernel client.
chainsMap[String(MONAD_MAINNET_NETWORK.chainId)] = monadMainnetChain;

// ZeroDev's current dashboard returns one chain-scoped Bundler/Paymaster RPC.
// Without an explicit override, this Dynamic connector can fall back to legacy
// v2 URLs that do not resolve the Monad chain for v3 ZeroDev projects.
const zeroDevWalletConnectors = zeroDevRpcUrl
  ? ZeroDevSmartWalletConnectorsWithConfig({
      bundlerRpc: zeroDevRpcUrl,
      defaultToKernelWithSponsorship: true,
      paymasterRpc: zeroDevRpcUrl,
    })
  : ZeroDevSmartWalletConnectors;

export default function Providers({ children }: { children: ReactNode }) {
  if (!hasDynamicEnvironment) return <>{children}</>;

  return (
    <DynamicContextProvider
      theme="light"
      settings={{
        environmentId: dynamicEnvironmentId,
        overrides: {
          evmNetworks: (networks) =>
            mergeNetworks([MONAD_MAINNET_NETWORK], networks),
        },
        walletConnectors: [EthereumWalletConnectors, zeroDevWalletConnectors],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
