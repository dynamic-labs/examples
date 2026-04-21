"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState, useEffect, useCallback } from "react";
import { config } from "@/lib/config";
import { useKYCMetadata } from "@/lib/hooks/useKYCMetadata";
import {
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  CHAINS,
  TOKENS,
  FIAT_CURRENCIES_FALLBACK,
  FIAT_SYMBOLS,
} from "@/constants/ramp";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import type {
  RampType,
  RegisteredWallet,
  RegisteredBank,
  FiatCurrency,
  QuoteData,
  TransactionResult,
} from "@/types/ramp";

interface AutoRamp {
  id: string;
  type: string;
  status: string;
  source_currency?: string;
  destination_currency?: string;
  source_amount?: number;
  destination_amount?: number;
  created_at?: string;
}

const ONBOARD_STEPS = [
  { key: "connect", label: "Connect Wallet" },
  { key: "kyc", label: "KYC" },
  { key: "signings", label: "Sign Docs" },
  { key: "wallet", label: "Register Wallet" },
  { key: "bank", label: "Add Bank" },
];

export function RampInterface() {
  const { user } = useDynamicContext();
  const {
    customerId: metaCustomerId,
    step: onboardingStep,
    walletAddress: metaWalletAddress,
    bankIban: metaBankIban,
    isLoading: metadataLoading,
  } = useKYCMetadata();

  const [rampType, setRampType] = useState<RampType>("offramp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [bankIban, setBankIban] = useState("");
  const isOnboarded = !!metaCustomerId && onboardingStep === "complete";

  const [selectedChain, setSelectedChain] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useState("");
  const [selectedBankIndex, setSelectedBankIndex] = useState<number | null>(
    null
  );
  const [selectedWalletIndex, setSelectedWalletIndex] = useState<
    number | null
  >(null);
  const [amount, setAmount] = useState("100");

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [registeredWallets, setRegisteredWallets] = useState<
    RegisteredWallet[]
  >([]);
  const [registeredBanks, setRegisteredBanks] = useState<RegisteredBank[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [fiatCurrencies, setFiatCurrencies] = useState<FiatCurrency[]>(
    FIAT_CURRENCIES_FALLBACK
  );

  const [transactions, setTransactions] = useState<AutoRamp[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (metadataLoading || !isOnboarded) return;
    if (metaCustomerId) setCustomerId(metaCustomerId);
    if (metaWalletAddress) setWalletAddress(metaWalletAddress);
    if (metaBankIban) setBankIban(metaBankIban);
  }, [
    metadataLoading,
    isOnboarded,
    metaCustomerId,
    metaWalletAddress,
    metaBankIban,
  ]);

  useEffect(() => {
    let cancelled = false;
    async function fetchFiat() {
      try {
        const res = await fetch(
          `${config.api.baseUrl}/api/iron/fiatcurrencies`
        );
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const data = json.data ?? json;
        if (Array.isArray(data) && data.length > 0 && !cancelled) {
          setFiatCurrencies(
            data.map((c: { code: string; name: string }) => ({
              id: c.code,
              name: c.name,
              symbol: FIAT_SYMBOLS[c.code] ?? c.code,
            }))
          );
        }
      } catch {
        /* keep fallback */
      }
    }
    fetchFiat();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchRegisteredAccounts = useCallback(async () => {
    if (!customerId || !isOnboarded) return;
    setLoadingAccounts(true);
    try {
      const [walletsRes, banksRes] = await Promise.all([
        fetch(
          `${config.api.baseUrl}/api/iron/customers/${customerId}/wallets`,
          {
            headers: {
              "x-dynamic-environment-id": config.dynamic.environmentId,
            },
          }
        ),
        fetch(`${config.api.baseUrl}/api/iron/customers/${customerId}/banks`, {
          headers: {
            "x-dynamic-environment-id": config.dynamic.environmentId,
          },
        }),
      ]);
      if (walletsRes.ok) {
        const d = await walletsRes.json();
        setRegisteredWallets(d.data?.data || d.data || []);
      }
      if (banksRes.ok) {
        const d = await banksRes.json();
        setRegisteredBanks(d.data?.data || d.data || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingAccounts(false);
    }
  }, [customerId, isOnboarded]);

  useEffect(() => {
    if (customerId) fetchRegisteredAccounts();
  }, [customerId, fetchRegisteredAccounts]);

  useEffect(() => {
    if (registeredWallets.length > 0 && selectedWalletIndex === null) {
      const i = metaWalletAddress
        ? registeredWallets.findIndex(
            (w) =>
              w.address.toLowerCase() === metaWalletAddress.toLowerCase()
          )
        : 0;
      const idx = i >= 0 ? i : 0;
      setSelectedWalletIndex(idx);
      setWalletAddress(registeredWallets[idx].address);
    }
  }, [registeredWallets, selectedWalletIndex, metaWalletAddress]);

  useEffect(() => {
    if (registeredBanks.length > 0 && selectedBankIndex === null) {
      const i = metaBankIban
        ? registeredBanks.findIndex(
            (b) =>
              (b.iban || b.account_identifier?.iban) === metaBankIban
          )
        : 0;
      const idx = i >= 0 ? i : 0;
      setSelectedBankIndex(idx);
      setBankIban(
        registeredBanks[idx].iban ||
          registeredBanks[idx].account_identifier?.iban ||
          ""
      );
    }
  }, [registeredBanks, selectedBankIndex, metaBankIban]);

  useEffect(() => {
    if (!customerId || !isOnboarded) return;
    let cancelled = false;
    async function fetchTransactions() {
      setLoadingTransactions(true);
      try {
        const res = await fetch(
          `${config.api.baseUrl}/api/iron/customers/${customerId}/autoramps`,
          {
            headers: {
              "x-dynamic-environment-id": config.dynamic.environmentId,
            },
          }
        );
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const data = json.data?.data || json.data || [];
        if (!cancelled) setTransactions(Array.isArray(data) ? data : []);
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoadingTransactions(false);
      }
    }
    fetchTransactions();
    return () => {
      cancelled = true;
    };
  }, [customerId, isOnboarded, success]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* silent */
    }
  };

  const handleGetQuote = async () => {
    setError("");
    if (!customerId) {
      setError("Complete onboarding first.");
      return;
    }
    if (!selectedChain || !selectedToken || !selectedFiatCurrency) {
      setError("Select all fields.");
      return;
    }
    if (rampType === "offramp" && selectedBankIndex === null) {
      setError("Select a bank account.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setLoading(true);
    setQuote(null);
    try {
      const endpoint =
        rampType === "onramp"
          ? `${config.api.baseUrl}/api/onramp`
          : `${config.api.baseUrl}/api/offramp`;
      const selectedBank =
        selectedBankIndex !== null ? registeredBanks[selectedBankIndex] : null;
      const selectedWallet =
        selectedWalletIndex !== null
          ? registeredWallets[selectedWalletIndex]
          : null;
      const selectedIban =
        selectedBank?.iban || selectedBank?.account_identifier?.iban;
      const selectedWalletAddr = selectedWallet?.address || walletAddress;

      const body =
        rampType === "onramp"
          ? {
              action: "quote",
              customer_id: customerId,
              source_currency: selectedFiatCurrency,
              destination_currency: selectedToken,
              source_amount: parseFloat(amount) * 100,
              payment_rail: "sepa" as const,
              wallet_address: selectedWalletAddr,
              blockchain: selectedChain,
            }
          : {
              action: "quote",
              customer_id: customerId,
              source_currency: selectedToken,
              destination_currency: selectedFiatCurrency,
              source_amount: parseFloat(amount) * 1000000,
              bank_account_id: selectedIban,
              blockchain: selectedChain,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dynamic-environment-id": config.dynamic.environmentId,
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to get ${rampType} quote`
        );
      }
      const data = await res.json();
      setQuote(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to get ${rampType} quote`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!quote) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const endpoint =
        rampType === "onramp"
          ? `${config.api.baseUrl}/api/onramp`
          : `${config.api.baseUrl}/api/offramp`;
      const selectedBank =
        selectedBankIndex !== null ? registeredBanks[selectedBankIndex] : null;
      const selectedWallet =
        selectedWalletIndex !== null
          ? registeredWallets[selectedWalletIndex]
          : null;
      const selectedIban =
        selectedBank?.iban || selectedBank?.account_identifier?.iban;
      const selectedWalletAddr = selectedWallet?.address || walletAddress;

      const body =
        rampType === "onramp"
          ? {
              action: "execute",
              quote_id: quote.id || quote.data?.id,
              customer_id: customerId,
              wallet_address: selectedWalletAddr,
              blockchain: selectedChain,
              source_currency: selectedFiatCurrency,
              destination_currency: selectedToken,
            }
          : {
              action: "execute",
              quote_id: quote.id || quote.data?.id,
              customer_id: customerId,
              bank_account_id: selectedIban,
              blockchain: selectedChain,
              source_currency: selectedToken,
              destination_currency: selectedFiatCurrency,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dynamic-environment-id": config.dynamic.environmentId,
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to execute ${rampType}`);
      const data = await res.json();
      setResult(data);
      setSuccess(
        `${rampType === "onramp" ? "Onramp" : "Offramp"} created successfully!`
      );
      setQuote(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to execute ${rampType}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Determine which onboarding steps are done
  const stepOrder = ["customer", "kyc", "signings", "wallet", "bank", "complete"];
  const currentStepIdx = stepOrder.indexOf(onboardingStep || "customer");

  const quoteData = quote?.data || quote;
  const paymentInstructions =
    result?.data?.payment_instructions || result?.payment_instructions;

  return (
    <div className="space-y-6 mt-6 pb-20">
      {/* Onboarding Status Card */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Onboarding Status</CardTitle>
        </CardHeader>
        <CardContent>
          {metadataLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading status...</span>
            </div>
          ) : !user ? (
            <p className="text-sm text-muted-foreground">
              Connect your wallet above to get started.
            </p>
          ) : isOnboarded ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Onboarding Complete</p>
                  <p className="text-xs text-muted-foreground">
                    Customer ID:{" "}
                    <span className="font-mono">{customerId || metaCustomerId}</span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                    Wallet
                  </p>
                  <p className="font-mono text-xs">
                    {metaWalletAddress
                      ? `${metaWalletAddress.slice(0, 8)}...${metaWalletAddress.slice(-6)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                    Bank (IBAN)
                  </p>
                  <p className="font-mono text-xs">
                    {metaBankIban
                      ? `...${metaBankIban.slice(-8)}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {ONBOARD_STEPS.map((s, i) => {
                  const stepKey =
                    s.key === "connect" ? "customer" : s.key;
                  const stepPos =
                    s.key === "connect" ? 0 : stepOrder.indexOf(stepKey);
                  const isDone = currentStepIdx > stepPos;
                  const isCurrent =
                    onboardingStep === stepKey ||
                    (s.key === "connect" && !onboardingStep);
                  return (
                    <div key={s.key} className="flex flex-col items-center gap-1">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                          isDone
                            ? "bg-green-500 text-white"
                            : isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className="text-xs text-center text-muted-foreground leading-tight">
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2">
                <Button asChild>
                  <Link href="/onboard">
                    Complete Onboarding{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ramp Card */}
      {isOnboarded && (
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quick Ramp</CardTitle>
                <CardDescription>
                  Convert between fiat and stablecoins
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchRegisteredAccounts}
                disabled={loadingAccounts}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loadingAccounts ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Ramp type toggle */}
            <div className="flex rounded-lg border bg-muted p-1 mb-6 max-w-xs">
              {(["onramp", "offramp"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setRampType(type);
                    setQuote(null);
                    setResult(null);
                    setError("");
                    setSuccess("");
                  }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    rampType === type
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "onramp" ? "Onramp" : "Offramp"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Form */}
              <div className="space-y-4">
                {!quote && !result && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Chain</Label>
                        <Select
                          value={selectedChain}
                          onValueChange={setSelectedChain}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select chain" />
                          </SelectTrigger>
                          <SelectContent>
                            {CHAINS.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>
                          {rampType === "onramp"
                            ? "Receive Token"
                            : "Send Token"}
                        </Label>
                        <Select
                          value={selectedToken}
                          onValueChange={setSelectedToken}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select token" />
                          </SelectTrigger>
                          <SelectContent>
                            {TOKENS.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>
                        {rampType === "onramp"
                          ? "Send Currency"
                          : "Receive Currency"}
                      </Label>
                      <Select
                        value={selectedFiatCurrency}
                        onValueChange={setSelectedFiatCurrency}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {fiatCurrencies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} {c.symbol && `(${c.symbol})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100"
                        min="0"
                      />
                    </div>

                    {rampType === "onramp" && (
                      <div className="space-y-1.5">
                        <Label>Destination Wallet</Label>
                        {registeredWallets.length > 0 ? (
                          <Select
                            value={selectedWalletIndex?.toString() ?? ""}
                            onValueChange={(v) => {
                              const idx = parseInt(v);
                              setSelectedWalletIndex(idx);
                              setWalletAddress(
                                registeredWallets[idx]?.address || ""
                              );
                            }}
                            disabled={loadingAccounts}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select wallet" />
                            </SelectTrigger>
                            <SelectContent>
                              {registeredWallets.map((w, i) => (
                                <SelectItem key={w.id} value={i.toString()}>
                                  {w.blockchain} —{" "}
                                  {w.address.slice(0, 6)}...
                                  {w.address.slice(-4)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="0x..."
                          />
                        )}
                      </div>
                    )}

                    {rampType === "offramp" && (
                      <div className="space-y-1.5">
                        <Label>Destination Bank Account</Label>
                        {registeredBanks.length > 0 ? (
                          <Select
                            value={selectedBankIndex?.toString() ?? ""}
                            onValueChange={(v) => {
                              const idx = parseInt(v);
                              setSelectedBankIndex(idx);
                              setBankIban(
                                registeredBanks[idx]?.iban ||
                                  registeredBanks[idx]?.account_identifier
                                    ?.iban ||
                                  ""
                              );
                            }}
                            disabled={loadingAccounts}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              {registeredBanks.map((b, i) => (
                                <SelectItem key={b.id} value={i.toString()}>
                                  {b.bank_name || b.label || "Bank"} —{" "}
                                  {(
                                    b.iban ||
                                    b.account_identifier?.iban ||
                                    ""
                                  ).slice(-8)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={bankIban}
                            onChange={(e) => setBankIban(e.target.value)}
                            placeholder="DE89..."
                          />
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleGetQuote}
                      disabled={loading}
                    >
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Get Quote
                    </Button>
                  </>
                )}
              </div>

              {/* Right: Quote / Result */}
              <div>
                {quote && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <p className="font-medium text-sm">Quote</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">You send</span>
                        <span className="font-medium">
                          {quoteData?.source_amount} {quoteData?.source_currency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          You receive
                        </span>
                        <span className="font-medium">
                          {quoteData?.destination_amount}{" "}
                          {quoteData?.destination_currency}
                        </span>
                      </div>
                      {quoteData?.exchange_rate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rate</span>
                          <span>{quoteData.exchange_rate}</span>
                        </div>
                      )}
                      {quoteData?.fees?.total_fee !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fee</span>
                          <span>{quoteData.fees.total_fee}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        className="flex-1"
                        onClick={handleExecute}
                        disabled={loading}
                      >
                        {loading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setQuote(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {result && paymentInstructions && (
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 space-y-3">
                    <div>
                      <p className="font-medium text-sm">
                        {rampType === "onramp"
                          ? "Send Payment To"
                          : "Payout Initiated"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rampType === "onramp"
                          ? "Transfer funds to this account to complete your onramp."
                          : "Your crypto will be converted and sent to your bank."}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      {Object.entries(paymentInstructions).map(([key, value]) =>
                        value ? (
                          <div
                            key={key}
                            className="flex justify-between items-center"
                          >
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">
                                {String(value)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleCopy(String(value), key)
                                }
                              >
                                {copiedField === key ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setResult(null);
                        setSuccess("");
                      }}
                    >
                      New Transaction
                    </Button>
                  </div>
                )}

                {!quote && !result && (
                  <div className="h-full flex items-center justify-center text-center p-6 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">
                      Fill in the form and click{" "}
                      <span className="font-medium">Get Quote</span> to see
                      your rate.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Card */}
      {isOnboarded && (
        <Card className="max-w-2xl mx-auto mb-6">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.type === "onramp"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        }`}
                      >
                        {tx.type === "onramp" ? "Onramp" : "Offramp"}
                      </span>
                      <span className="text-muted-foreground text-xs font-mono">
                        {tx.id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {tx.source_amount
                          ? `${tx.source_amount} ${tx.source_currency ?? ""}`
                          : "—"}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          tx.status === "completed" ||
                          tx.status === "Completed"
                            ? "text-green-600 dark:text-green-400"
                            : tx.status === "failed" || tx.status === "Failed"
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
