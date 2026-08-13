/**
 * Reads a wallet's native ETH balance on Base mainnet via a plain, public
 * viem client — deliberately NOT `useGetTokenBalances` (that SDK hook only
 * returns ERC-20/whitelisted token balances, e.g. USDC). Used to detect
 * whether the vault has enough ETH to pay for a withdrawal's gas before
 * letting the user submit one (see WithdrawRoute.tsx).
 *
 * A raw RPC balance read needs no wallet connection, so this sidesteps any
 * "which network is the connected wallet active on" ambiguity entirely —
 * Base is hardcoded here via viem's own `base` chain descriptor, not
 * derived from whatever network a connected wallet happens to be on.
 */
import { createPublicClient, http, type Address } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http(),
});

export function getNativeBalance(address: string): Promise<bigint> {
  return client.getBalance({ address: address as Address });
}
