"use client";

import { useRef, useState } from "react";
import { exportWaasPrivateKey } from "@dynamic-labs-sdk/client/waas";
import { dynamicClient } from "@/lib/dynamic";
import { KeyRound } from "lucide-react";
import type { SolanaWalletAccount } from "@dynamic-labs-sdk/solana";

interface ExportKeyCardProps {
  walletAccount: SolanaWalletAccount;
}

export function ExportKeyCard({ walletAccount }: ExportKeyCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleExport = async () => {
    if (!containerRef.current) return;
    setLoading(true);
    setError(null);
    try {
      await exportWaasPrivateKey(
        { displayContainer: containerRef.current, password, walletAccount },
        dynamicClient
      );
      setRevealed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #DADADA" }}>
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="h-4 w-4 text-[#606060]" />
        <h3 className="text-sm font-medium text-[#030303]">Export Private Key</h3>
      </div>

      {!revealed ? (
        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4779FF]"
            style={{ border: "1px solid #DADADA", background: "#F9F9F9" }}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#030303", color: "#fff" }}
          >
            {loading ? "Exporting…" : "Reveal Private Key"}
          </button>
        </div>
      ) : null}

      <div ref={containerRef} className={revealed ? "mt-2" : "hidden"} />
    </div>
  );
}
