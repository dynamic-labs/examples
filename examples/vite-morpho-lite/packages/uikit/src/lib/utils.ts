import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Address, Chain, formatUnits } from "viem";
import {
  arbitrum,
  base,
  corn,
  flame,
  fraxtal,
  hemi,
  ink,
  lisk,
  mainnet,
  mode as modeMainnet,
  optimism,
  plumeMainnet,
  polygon,
  scroll as scrollMainnet,
  soneium,
  sonic,
  unichain,
  worldchain,
} from "wagmi/chains";

import {
  arbitrumIcon,
  baseIcon,
  campIcon,
  cornIcon,
  ethereumIcon,
  flameIcon,
  fraxtalIcon,
  hemiIcon,
  hyperliquidIcon,
  inkIcon,
  katanaIcon,
  liskIcon,
  modeIcon,
  optimismIcon,
  plumeIcon,
  polygonIcon,
  scrollIcon,
  soneiumIcon,
  sonicIcon,
  tacIcon,
  unichainIcon,
  worldchainIcon,
} from "../main";

import * as customChains from "./chains";
export function getChainSlug(chain: Pick<Chain, "name">) {
  return chain.name.toLowerCase().replace(" ", "-");
}

export function getDomain(url: string): string {
  const hostname = new URL(url).hostname;
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function tryFormatBalance(
  balance: bigint | undefined,
  decimals: number | undefined,
  maxSigDigits: number | "exact" = "exact",
  enableSuffixes = false,
) {
  return balance === undefined || decimals === undefined
    ? undefined
    : formatBalance(balance, decimals, maxSigDigits, enableSuffixes);
}

export function formatBalance(
  balance: bigint,
  decimals: number,
  maxSigDigits: number | "exact" = "exact",
  enableSuffixes = false,
) {
  const numDigits = balance.toString(10).length - 1;
  if (maxSigDigits !== "exact" && numDigits + 1 > maxSigDigits) {
    const resolution = 10n ** BigInt(numDigits + 1 - maxSigDigits);
    balance = (balance / resolution) * resolution;
  }

  const suffixes = ["", "k", "M", "B", "T"];
  let suffixIdx = 0;
  if (enableSuffixes) {
    const orderOfMagnitude = Math.max(0, numDigits - decimals);
    suffixIdx = Math.min(Math.floor(orderOfMagnitude / 3), suffixes.length - 1);
    decimals += suffixIdx * 3;
  }
  return formatUnits(balance, decimals).concat(suffixes[suffixIdx]);
}

export function formatBalanceWithSymbol(
  balance: bigint,
  decimals: number,
  symbol?: string,
  maxSigDigs: number | "exact" = "exact",
  enableSuffixes = false,
) {
  const balanceStr = formatBalance(balance, decimals, maxSigDigs, enableSuffixes);
  if (symbol) return `${balanceStr} ${symbol}`;
  return balanceStr;
}

export function formatLtv(ltv: bigint) {
  return `${(Number(ltv / 1_000_000_000n) / 1e7).toFixed(2)}%`;
}

export function formatApy(apy: bigint) {
  return `${(Number(apy / 1_000_000_000n) / 1e7).toFixed(2)}%`;
}

export function abbreviateAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export type Token = { address: Address; symbol?: string; decimals?: number; imageSrc?: string };

/**
 * Generate a url for a token's svg leveraging the Morpho CDN.
 */
export function getTokenSymbolURI(symbol: string | undefined): Token["imageSrc"] {
  if (!symbol) {
    return undefined;
  } else if (symbol === "USDC.e") {
    symbol = "USDC";
  } else if (symbol === "WLD") {
    // TODO: remove once it's included on Morpho CDN
    return "https://storage.googleapis.com/merkl-static-assets/tokens/WLD.jpeg";
  } else if (symbol === "LSK") {
    // TODO: remove once it's included on Morpho CDN
    return "https://s2.coinmarketcap.com/static/img/coins/64x64/1214.png";
  } else if (symbol === "M-BTC") {
    // TODO: remove once it's included on Morpho CDN
    return "https://s2.coinmarketcap.com/static/img/coins/64x64/34686.png";
  } else if (symbol === "USD₮") {
    return "https://cdn.morpho.org/assets/logos/usdt.svg";
  } else if (symbol === "USD₮0") {
    // TODO: remove once it's included on Morpho CDN
    return "https://assets.coingecko.com/coins/images/53705/standard/usdt0.jpg";
  } else if (symbol === "TON") {
    return "https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png";
  }
  return `https://cdn.morpho.org/assets/logos/${encodeURIComponent((symbol ?? "").toLowerCase())}.svg`;
}

export function promiseWithTimeout<T>(
  promise: Promise<T>,
  ms: number,
  error = new Error("Promise timed out"),
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(error), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function areSetsEqual<T>(a: Set<T>, b: Set<T>) {
  if (a.size !== b.size) return false;

  for (const key of a) {
    if (!b.has(key)) return false;
  }
  return true;
}

export function compareBigInts(a: bigint, b: bigint) {
  if (a == b) return 0;
  return a > b ? 1 : -1;
}

export function max(a: bigint, b: bigint) {
  return a > b ? a : b;
}

export function min(a: bigint, b: bigint) {
  return a < b ? a : b;
}

/**
 * Get the icon URL for a chain by its ID for Dynamic wallet configuration
 * Returns a data URL containing the SVG content
 */
export function getChainIconUrl(chainId: number): string | undefined {
  let svgContent: string;

  switch (chainId) {
    case arbitrum.id:
      svgContent = arbitrumIcon;
      break;
    case base.id:
      svgContent = baseIcon;
      break;
    case customChains.basecamp.id:
      svgContent = campIcon;
      break;
    case corn.id:
      svgContent = cornIcon;
      break;
    case flame.id:
      svgContent = flameIcon;
      break;
    case fraxtal.id:
      svgContent = fraxtalIcon;
      break;
    case hemi.id:
      svgContent = hemiIcon;
      break;
    case customChains.hyperevm.id:
      svgContent = hyperliquidIcon;
      break;
    case ink.id:
      svgContent = inkIcon;
      break;
    case customChains.katana.id:
      svgContent = katanaIcon;
      break;
    case lisk.id:
      svgContent = liskIcon;
      break;
    case mainnet.id:
      svgContent = ethereumIcon;
      break;
    case modeMainnet.id:
      svgContent = modeIcon;
      break;
    case optimism.id:
      svgContent = optimismIcon;
      break;
    case plumeMainnet.id:
      svgContent = plumeIcon;
      break;
    case polygon.id:
      svgContent = polygonIcon;
      break;
    case scrollMainnet.id:
      svgContent = scrollIcon;
      break;
    case soneium.id:
      svgContent = soneiumIcon;
      break;
    case sonic.id:
      svgContent = sonicIcon;
      break;
    case customChains.tac.id:
      svgContent = tacIcon;
      break;
    case unichain.id:
      svgContent = unichainIcon;
      break;
    case worldchain.id:
      svgContent = worldchainIcon;
      break;
    default:
      return undefined;
  }

  // Convert SVG content to a data URL
  const encoded = encodeURIComponent(svgContent).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
    String.fromCharCode(parseInt(p1, 16)),
  );
  return `data:image/svg+xml;base64,${btoa(encoded)}`;
}
