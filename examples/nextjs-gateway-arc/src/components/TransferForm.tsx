"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";
import { createPublicClient, http } from "viem";
import { CONTRACTS, DOMAIN } from "@/lib/chains";
import { arcTestnet, baseSepolia, sepolia } from "viem/chains";
import { GatewayAPI, burnIntent, burnIntentTypedData } from "@/lib/gateway";

// Minimal ABI for gatewayMint
const gatewayMinterAbi = [
  {
    type: "function",
    name: "gatewayMint",
    inputs: [
      { name: "attestationPayload", type: "bytes", internalType: "bytes" },
      { name: "signature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

type ChainKey = "sepolia" | "baseSepolia" | "arcTestnet";

const CHAIN_MAP = {
  sepolia: { chain: sepolia, domain: DOMAIN.sepolia },
  baseSepolia: { chain: baseSepolia, domain: DOMAIN.baseSepolia },
  arcTestnet: { chain: arcTestnet, domain: DOMAIN.arcTestnet },
} as const;

const CHAINS: { key: ChainKey; label: string }[] = [
  { key: "sepolia", label: "Sepolia (domain 0)" },
  { key: "baseSepolia", label: "Base Sepolia (domain 6)" },
  { key: "arcTestnet", label: "Arc Testnet (domain 26)" },
];

export default function TransferForm() {
  const accounts = useWalletAccounts();
  const evmWallet = accounts.find(isEvmWalletAccount) ?? null;
  const address = evmWallet?.address as `0x${string}` | undefined;
  const [amountEth, setAmountEth] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [source, setSource] = useState<ChainKey>("sepolia");
  const [destination, setDestination] = useState<ChainKey>("baseSepolia");

  const onTransfer = async () => {
    if (!evmWallet || !address) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      if (source === destination) {
        throw new Error("Source and destination must be different");
      }

      const src = CHAIN_MAP[source];
      const dst = CHAIN_MAP[destination];

      // Build burn intent for selected source → destination
      const intent = burnIntent({
        account: address,
        from: {
          domain: src.domain,
          gatewayWallet: { address: CONTRACTS.gatewayWallet as `0x${string}` },
          usdc: { address: CONTRACTS.usdc[source] as `0x${string}` },
        },
        to: {
          domain: dst.domain,
          gatewayMinter: { address: CONTRACTS.gatewayMinter as `0x${string}` },
          usdc: { address: CONTRACTS.usdc[destination] as `0x${string}` },
        },
        amount: parseFloat(amountEth),
        recipient: address,
      });

      const typedData = burnIntentTypedData(intent);

      // Create wallet client for source chain to sign
      const srcWalletClient = createWalletClientForWalletAccount({
        walletAccount: evmWallet,
        chain: src.chain,
      });

      // Sign EIP-712 typed data via Dynamic SDK wallet client
      const signature = await srcWalletClient.signTypedData({
        account: address,
        domain: typedData.domain as {
          name: string;
          version: string;
        },
        // Omit EIP712Domain from types per EIP-712 + Viem expectations
        types: {
          TransferSpec: typedData.types.TransferSpec as Array<{
            name: string;
            type: string;
          }>,
          BurnIntent: typedData.types.BurnIntent as Array<{
            name: string;
            type: string;
          }>,
        },
        primaryType: typedData.primaryType as "BurnIntent",
        message: typedData.message as Record<string, unknown>,
      });

      // Request attestation
      const resp = await GatewayAPI.post("/transfer", [
        { burnIntent: typedData.message, signature },
      ]);
      if (resp.success === false)
        throw new Error(resp.message || "Gateway error");

      const { attestation, signature: attSig } = resp;

      // Create wallet client for destination chain to mint
      const dstWalletClient = createWalletClientForWalletAccount({
        walletAccount: evmWallet,
        chain: dst.chain,
      });

      const dstPublicClient = createPublicClient({
        chain: dst.chain,
        transport: http(),
      });

      // Mint on destination chain
      const hash = await dstWalletClient.writeContract({
        address: CONTRACTS.gatewayMinter as `0x${string}`,
        abi: gatewayMinterAbi,
        functionName: "gatewayMint",
        args: [attestation, attSig],
        account: address,
      });
      await dstPublicClient.waitForTransactionReceipt({ hash });
      setTxHash(hash);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Failed to transfer";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer USDC</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm text-muted-foreground">
              Source chain
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={source}
              onChange={(e) => setSource(e.target.value as ChainKey)}
            >
              {CHAINS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm text-muted-foreground">
              Destination chain
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={destination}
              onChange={(e) => setDestination(e.target.value as ChainKey)}
            >
              {CHAINS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm text-muted-foreground">
              Amount (USDC)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountEth}
              onChange={(e) => setAmountEth(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Amount"
            />
          </div>
          <div className="sm:col-span-3 flex items-end">
            <Button
              onClick={onTransfer}
              disabled={loading || !address}
              className="w-full"
            >
              {loading ? "Transferring..." : "Transfer"}
            </Button>
          </div>
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        {txHash && (
          <div className="text-sm">
            Mint tx: <span className="break-all">{txHash}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
