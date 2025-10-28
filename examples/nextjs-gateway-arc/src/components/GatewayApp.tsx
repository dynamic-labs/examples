"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DynamicButton from "@/components/dynamic/dynamic-button";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import TransferForm from "@/components/TransferForm";
import DepositForm from "@/components/DepositForm";

type Balance = { domain: number; balance: string };

class GatewayClient {
  static GATEWAY_API_BASE_URL = "https://gateway-api-testnet.circle.com/v1";
  static DOMAINS = { sepolia: 0, baseSepolia: 6, arcTestnet: 26 } as const;

  async info() {
    return this.#get("/info");
  }

  async balances(token: string, depositor: string, domains?: number[]) {
    if (!domains) domains = [0, 6, 26];
    return this.#post("/balances", {
      token,
      sources: domains.map((domain) => ({ depositor, domain })),
    });
  }

  async #get(path: string) {
    const res = await fetch(GatewayClient.GATEWAY_API_BASE_URL + path);
    return res.json();
  }

  async #post(path: string, body: unknown) {
    const res = await fetch(GatewayClient.GATEWAY_API_BASE_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v
      ),
    });
    return res.json();
  }
}

export default function GatewayApp() {
  const isLoggedIn = useIsLoggedIn();
  const { primaryWallet, sdkHasLoaded } = useDynamicContext();
  const address = primaryWallet?.address;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);

  const gateway = useMemo(() => new GatewayClient(), []);

  useEffect(() => {
    if (!sdkHasLoaded || !address) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await gateway.balances("USDC", address, [0, 6, 26]);
        setBalances(resp.balances || []);
      } catch {
        setError("Failed to load balances");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [sdkHasLoaded, address, gateway]);

  return (
    <div className="w-full max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Circle Gateway (Testnet)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isLoggedIn ? (
            <DynamicButton />
          ) : (
            <>
              <div className="text-sm text-muted-foreground break-all">
                Address: {address}
              </div>
              <div className="space-y-2">
                <div className="font-medium">USDC Balances</div>
                <div className="text-sm text-muted-foreground">
                  Base Sepolia (domain 6), Sepolia (domain 0), Arc Testnet
                  (domain 26)
                </div>
                {loading ? (
                  <div>Loading balances...</div>
                ) : error ? (
                  <div className="text-red-500">{error}</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span>Domain 0 (Sepolia)</span>
                      <span>
                        {balances.find((b) => b.domain === 0)?.balance ?? "0"}{" "}
                        USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span>Domain 6 (Base Sepolia)</span>
                      <span>
                        {balances.find((b) => b.domain === 6)?.balance ?? "0"}{" "}
                        USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span>Domain 26 (Arc Testnet)</span>
                      <span>
                        {balances.find((b) => b.domain === 26)?.balance ?? "0"}{" "}
                        USDC
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <DepositForm />
                <TransferForm />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
