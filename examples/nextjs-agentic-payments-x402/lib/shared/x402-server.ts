/**
 * Server-side x402 v2 resource server.
 *
 * Settles payments on **Base Sepolia** via the public x402 facilitator — no API
 * keys required (it sponsors testnet settlement for free). The ExactEvmScheme
 * handles the gasless USDC EIP-3009 "exact" scheme.
 */
import "server-only";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { X402_NETWORK } from "@/lib/shared/constants";

const facilitator = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

export const x402Server = new x402ResourceServer(facilitator).register(
  X402_NETWORK,
  new ExactEvmScheme()
);
