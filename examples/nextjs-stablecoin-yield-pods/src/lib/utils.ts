import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { mainnet, base, polygon, arbitrum, optimism } from "viem/chains";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const supportedChains = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [polygon.id]: polygon,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
};

export function getChainName(chainId: number): string {
  const chain = supportedChains[chainId as keyof typeof supportedChains];
  return chain ? chain.name : `Chain ${chainId}`;
}
