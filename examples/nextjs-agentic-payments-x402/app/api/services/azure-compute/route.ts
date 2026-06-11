import { type NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { X402_NETWORK } from "@/lib/shared/constants";
import { x402Server } from "@/lib/shared/x402-server";

/**
 * Sample paid "cloud service" — stands in for an Azure service the agent buys.
 *
 * `withX402` (x402 v2) gates this handler: a request without a valid payment
 * gets HTTP 402 + payment requirements; once the caller attaches a settled USDC
 * payment, the handler runs and returns the "provisioned" resource. Settlement
 * happens only after a successful (status < 400) response. The handler itself
 * contains no crypto — it just serves the product, framed in plain USD.
 */
const payTo = (process.env.X402_PAY_TO ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

if (!process.env.X402_PAY_TO) {
  console.warn("[x402] X402_PAY_TO is not set — the service route will error.");
}

async function handler(_request: NextRequest) {
  const provisionedAt = new Date().toISOString();
  return NextResponse.json({
    status: "provisioned",
    service: "Azure-style compute unit",
    resourceId: `vm-${Math.random().toString(36).slice(2, 10)}`,
    region: "eastus",
    spec: { vcpus: 2, memoryGb: 8 },
    priceUsd: "0.01",
    provisionedAt,
    message: "Compute unit provisioned. Charged $0.01 to your account.",
  });
}

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      payTo,
      price: "$0.01",
      network: X402_NETWORK,
    },
    description: "Provision an Azure-style compute unit (demo resource)",
    mimeType: "application/json",
  },
  x402Server
  // syncFacilitatorOnStart defaults to true — the server fetches the public
  // facilitator's supported kinds on startup so it knows it supports `exact`
  // on Base Sepolia. (No CDP auth on the public facilitator, so this won't 401.)
);
