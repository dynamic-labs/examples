/**
 * Reads a wallet's USDC balance on Base mainnet via a direct on-chain
 * `balanceOf` call — deliberately NOT `useGetTokenBalances` (that SDK hook
 * reads from Dynamic's own balances API, which is indexer-backed and can lag
 * a very recent on-chain transfer by several minutes even with
 * `forceRefresh: true`; that lag is what made a real, already-landed deposit
 * look "missing" on the Home screen).
 *
 * Mirrors getNativeBalance.ts's "sidestep the ambiguity, read the chain
 * directly" approach, but built from the SDK's own
 * createPublicClientFromNetworkData instead of a bare viem client pointed at
 * viem/chains' `base` descriptor — this app has no reason to special-case
 * Base's RPC URL by hand when the SDK already exposes the project's
 * configured network data (including RPC URLs) for exactly this purpose.
 */
import { getNetworksData } from '@dynamic-labs-sdk/client';
import { createPublicClientFromNetworkData } from '@dynamic-labs-sdk/evm/viem';
import { erc20Abi, type Address } from 'viem';
import { config } from '../consts/config';

function getBaseNetworkData() {
  const networkData = getNetworksData().find(
    network => network.networkId === config.chainId,
  );
  if (!networkData) {
    throw new Error(
      `No configured network data found for chain ${config.chainId} — check the Dynamic dashboard's enabled networks.`,
    );
  }
  return networkData;
}

export async function getUsdcBalance(address: string): Promise<bigint> {
  const client = createPublicClientFromNetworkData({
    networkData: getBaseNetworkData(),
  });
  return client.readContract({
    address: config.usdcAddress as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as Address],
  });
}
