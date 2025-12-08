"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { CONTRACTS } from "@/lib/chains";
import { arcTestnet, baseSepolia, sepolia } from "wagmi/chains";
import { parseUnits } from "viem";

const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
];

// Minimal ABI for GatewayWallet.deposit(address token, uint256 amount)
const gatewayWalletAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
  },
];

type ChainKey = "sepolia" | "baseSepolia" | "arcTestnet";
type ChainId = typeof sepolia.id | typeof baseSepolia.id | typeof arcTestnet.id;

const CHAINS: { key: ChainKey; label: string; id: ChainId }[] = [
  { key: "sepolia", label: "Sepolia (domain 0)", id: sepolia.id },
  { key: "baseSepolia", label: "Base Sepolia (domain 6)", id: baseSepolia.id },
  { key: "arcTestnet", label: "Arc Testnet (domain 26)", id: arcTestnet.id },
];

export default function DepositForm() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [amount, setAmount] = useState("1");
  const [source, setSource] = useState<ChainKey>("sepolia");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const onDeposit = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      // Basic validation
      if (!amount || Number(amount) <= 0) {
        throw new Error("Enter a positive amount");
      }

      const selected = CHAINS.find((c) => c.key === source)!;
      if (chainId !== selected.id) {
        await switchChainAsync({ chainId: selected.id });
      }

      const tokenAddress = CONTRACTS.usdc[source] as `0x${string}`;
      const gatewayWallet = CONTRACTS.gatewayWallet as `0x${string}`;
      const value = parseUnits(amount || "0", 6);

      // 1) Approve GatewayWallet to spend USDC
      const approveHash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [gatewayWallet, value],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // 2) Call deposit on GatewayWallet
      const depositHash = await writeContractAsync({
        address: gatewayWallet,
        abi: gatewayWalletAbi,
        functionName: "deposit",
        args: [tokenAddress, value],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: depositHash });
      }
      setTxHash(depositHash);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to deposit";
      if (
        typeof msg === "string" &&
        msg.toLowerCase().includes("insufficient funds")
      ) {
        setError("Not enough native token to pay gas on the selected chain");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit USDC to Gateway</CardTitle>
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
              Amount (USDC)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Amount"
            />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <Button
              onClick={onDeposit}
              disabled={loading || !address}
              className="w-full"
            >
              {loading ? "Depositing..." : "Deposit"}
            </Button>
          </div>
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        {txHash && (
          <div className="text-sm">
            Deposit tx: <span className="break-all">{txHash}</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Approves and deposits USDC into the gateway wallet contract:{" "}
          {CONTRACTS.gatewayWallet}
        </div>
      </CardContent>
    </Card>
  );
}
