"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState, useCallback } from "react";
import { config } from "@/lib/config";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useKYCMetadata, type OnboardStep } from "@/lib/hooks/useKYCMetadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface RequiredSigning {
  id: string;
  display_name: string;
  type: string;
  url?: string;
  text?: string;
}

const STEPS: { key: OnboardStep; label: string }[] = [
  { key: "customer", label: "Profile" },
  { key: "kyc", label: "KYC" },
  { key: "signings", label: "Sign" },
  { key: "wallet", label: "Wallet" },
  { key: "bank", label: "Bank" },
  { key: "complete", label: "Done" },
];

export default function OnboardPage() {
  const { user, primaryWallet } = useDynamicContext();
  const {
    customerId,
    identificationId,
    kycUrl,
    step,
    isLoading: initializing,
    updateState,
    reset,
  } = useKYCMetadata();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiredSignings, setRequiredSignings] = useState<RequiredSigning[]>([]);
  const isSandbox =
    process.env.NEXT_PUBLIC_IRON_ENVIRONMENT === "sandbox" ||
    !process.env.NEXT_PUBLIC_IRON_ENVIRONMENT;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    countryCode: "DE",
    dateOfBirth: "",
    phoneNumber: "",
  });

  const [bankData, setBankData] = useState({
    accountHolderName: "",
    iban: "",
    bankName: "",
    bankCountry: "DE",
    street: "",
    city: "",
    state: "",
    country: "DE",
    postalCode: "",
  });

  const handleStartOver = useCallback(async () => {
    if (!confirm("Start over? This will clear your progress.")) return;
    await reset();
    setError("");
    setRequiredSignings([]);
  }, [reset]);

  const handleCreateCustomer = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${config.api.baseUrl}/api/iron/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "individual",
          email: user.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          country_code: formData.countryCode,
          date_of_birth: formData.dateOfBirth,
          phone_number: formData.phoneNumber,
        }),
      });
      if (!res.ok) throw new Error("Failed to create customer");
      const result = await res.json();
      await updateState({ customerId: result.data.id, step: "kyc" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  const handleStartKYC = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${config.api.baseUrl}/api/iron/customers/${customerId}/kyc`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ return_url: window.location.origin + "/onboard" }),
        }
      );
      if (!res.ok) throw new Error("Failed to start KYC");
      const result = await res.json();
      const updates: Partial<{ identificationId: string; kycUrl: string; step: OnboardStep }> = {
        step: "signings",
      };
      if (result.data?.id) updates.identificationId = result.data.id;
      if (result.data?.verification_url || result.data?.url) {
        updates.kycUrl = result.data.verification_url || result.data.url;
      }
      await updateState(updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start KYC");
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxApproveKYC = async () => {
    let idToApprove = identificationId;
    if (!idToApprove) {
      try {
        setLoading(true);
        const res = await fetch(
          `${config.api.baseUrl}/api/iron/customers/${customerId}/identifications`
        );
        if (res.ok) {
          const result = await res.json();
          const pending = result.data?.find(
            (id: { status: string }) => id.status === "Pending" || id.status === "Processed"
          );
          if (pending?.id) {
            idToApprove = pending.id;
            await updateState({ identificationId: pending.id });
          } else {
            throw new Error("No pending identification found");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch identification");
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${config.api.baseUrl}/api/iron/sandbox/identification/${idToApprove}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true }),
        }
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to approve identification");
      }
      await updateState({ step: "signings" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve identification");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSignings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${config.api.baseUrl}/api/iron/customers/${customerId}/signings`
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || "";
        if (res.status === 409 && errorMsg.includes("not in status SigningsRequired")) {
          setError("KYC still pending. Complete KYC first or wait for approval.");
          return;
        }
        if (res.status === 404 || errorMsg.includes("no required signings")) {
          setRequiredSignings([]);
          await updateState({ step: "wallet" });
          return;
        }
        throw new Error(errorMsg || "Failed to fetch signings");
      }
      const result = await res.json();
      const signings = result.data || [];
      if (signings.length === 0) {
        await updateState({ step: "wallet" });
      } else {
        setRequiredSignings(signings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch signings");
    } finally {
      setLoading(false);
    }
  };

  const handleSignDocument = async (signing: RequiredSigning) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${config.api.baseUrl}/api/iron/customers/${customerId}/signings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_id: signing.id,
            content_type: signing.type || "Url",
            signed: true,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to sign document");
      const remaining = requiredSignings.filter((s) => s.id !== signing.id);
      setRequiredSignings(remaining);
      if (remaining.length === 0) await updateState({ step: "wallet" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign document");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setLoading(true);
    setError("");
    try {
      if (!primaryWallet) throw new Error("No wallet connected.");
      let walletAddress = primaryWallet.address;
      if (!walletAddress) throw new Error("Unable to get wallet address");
      walletAddress = walletAddress.toLowerCase();

      const chainId = primaryWallet.chain;
      let blockchain = "Base";
      if (chainId && chainId !== "EVM") {
        const n = typeof chainId === "string" ? parseInt(chainId) : chainId;
        if (!isNaN(n)) {
          switch (n) {
            case 1: blockchain = "Ethereum"; break;
            case 137: blockchain = "Polygon"; break;
            case 42161: blockchain = "Arbitrum"; break;
            case 8453: blockchain = "Base"; break;
          }
        }
      }

      const now = new Date();
      const dateStr = `${now.getUTCDate().toString().padStart(2, "0")}/${(now.getUTCMonth() + 1).toString().padStart(2, "0")}/${now.getUTCFullYear()}`;
      const proofMessage = `I am verifying ownership of the wallet address ${walletAddress} as customer ${customerId}. This message was signed on ${dateStr} to confirm my control over this wallet.`;
      const signature = await primaryWallet.signMessage(proofMessage);
      if (!signature) throw new Error("Failed to sign message");

      const res = await fetch(`${config.api.baseUrl}/api/iron/wallets/self-hosted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          blockchain,
          address: walletAddress,
          message: proofMessage,
          signature,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to register wallet");
      }
      const result = await res.json();
      await updateState({ walletId: result.data.id, walletAddress, step: "bank" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBankAccount = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${config.api.baseUrl}/api/iron/banks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          currency: "EUR",
          account_holder_name: bankData.accountHolderName,
          iban: bankData.iban,
          bank_name: bankData.bankName,
          bank_country: bankData.bankCountry,
          street: bankData.street,
          city: bankData.city,
          state: bankData.state,
          country: bankData.country,
          postal_code: bankData.postalCode,
          label: "Primary Bank Account",
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to add bank account");
      }
      const result = await res.json();
      await updateState({
        bankAccountId: result.data?.id || "",
        bankIban: bankData.iban,
        step: "complete",
        kycCompleted: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add bank account");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Connect your wallet to begin onboarding.</p>
        </div>
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
    <div className="container mx-auto px-4 py-20 pb-24 max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Onboarding</h1>
        {step !== "customer" && step !== "complete" && (
          <Button variant="ghost" size="sm" onClick={handleStartOver}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Start Over
          </Button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map(({ key, label }, i) => {
          const isCompleted = currentStepIndex > i;
          const isCurrent = step === key;
          return (
            <div key={key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 ${isCompleted ? "bg-green-500" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Customer Profile */}
      {step === "customer" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>We need a few details to create your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Smith"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Country Code</Label>
                <Input
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                  placeholder="DE"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+49..."
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleCreateCustomer}
              disabled={loading || !formData.firstName || !formData.lastName || !formData.dateOfBirth}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: KYC */}
      {step === "kyc" && (
        <Card>
          <CardHeader>
            <CardTitle>Identity Verification</CardTitle>
            <CardDescription>Complete KYC to verify your identity with Iron Finance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {kycUrl ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Your KYC session is ready. Complete verification in the link below.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href={kycUrl} target="_blank" rel="noopener noreferrer">
                    Open KYC Verification
                  </a>
                </Button>
                {isSandbox && (
                  <Button className="w-full" onClick={handleSandboxApproveKYC} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sandbox: Approve KYC
                  </Button>
                )}
                <Button variant="secondary" className="w-full" onClick={handleFetchSignings} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  I&apos;ve Completed KYC →
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Start KYC verification to confirm your identity.
                </p>
                <Button className="w-full" onClick={handleStartKYC} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Start KYC Verification
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Signings */}
      {step === "signings" && (
        <Card>
          <CardHeader>
            <CardTitle>Sign Documents</CardTitle>
            <CardDescription>Review and sign the required terms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiredSignings.length === 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Fetch required signings to continue.
                </p>
                <Button className="w-full" onClick={handleFetchSignings} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Check Required Signings
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                {requiredSignings.map((signing) => (
                  <div key={signing.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{signing.display_name}</p>
                      {signing.url && (
                        <a
                          href={signing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          View document
                        </a>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleSignDocument(signing)} disabled={loading}>
                      Sign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Wallet */}
      {step === "wallet" && (
        <Card>
          <CardHeader>
            <CardTitle>Register Wallet</CardTitle>
            <CardDescription>
              Link your embedded wallet to your Iron Finance account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your wallet address:{" "}
              <span className="font-mono text-foreground">
                {primaryWallet?.address
                  ? `${primaryWallet.address.slice(0, 6)}...${primaryWallet.address.slice(-4)}`
                  : "Not connected"}
              </span>
            </p>
            <Button className="w-full" onClick={handleCreateWallet} disabled={loading || !primaryWallet}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Bank Account */}
      {step === "bank" && (
        <Card>
          <CardHeader>
            <CardTitle>Add Bank Account</CardTitle>
            <CardDescription>Add your SEPA bank account for transfers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Account Holder Name</Label>
              <Input
                value={bankData.accountHolderName}
                onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label>IBAN</Label>
              <Input
                value={bankData.iban}
                onChange={(e) => setBankData({ ...bankData, iban: e.target.value })}
                placeholder="DE89370400440532013000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Bank Name</Label>
                <Input
                  value={bankData.bankName}
                  onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                  placeholder="Deutsche Bank"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bank Country</Label>
                <Input
                  value={bankData.bankCountry}
                  onChange={(e) => setBankData({ ...bankData, bankCountry: e.target.value.toUpperCase() })}
                  placeholder="DE"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">Account Holder Address</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Street</Label>
                  <Input
                    value={bankData.street}
                    onChange={(e) => setBankData({ ...bankData, street: e.target.value })}
                    placeholder="Hauptstraße 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input
                      value={bankData.city}
                      onChange={(e) => setBankData({ ...bankData, city: e.target.value })}
                      placeholder="Berlin"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Postal Code</Label>
                    <Input
                      value={bankData.postalCode}
                      onChange={(e) => setBankData({ ...bankData, postalCode: e.target.value })}
                      placeholder="10115"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>State</Label>
                    <Input
                      value={bankData.state}
                      onChange={(e) => setBankData({ ...bankData, state: e.target.value })}
                      placeholder="Berlin"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input
                      value={bankData.country}
                      onChange={(e) => setBankData({ ...bankData, country: e.target.value.toUpperCase() })}
                      placeholder="DE"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleAddBankAccount}
              disabled={
                loading ||
                !bankData.accountHolderName ||
                !bankData.iban ||
                !bankData.bankName ||
                !bankData.street ||
                !bankData.city
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Bank Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Complete */}
      {step === "complete" && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">All Set!</h2>
              <p className="text-sm text-muted-foreground">
                Your account is ready. Start ramping fiat to crypto.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/ramp">Go to Ramp →</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </div>
  );
}
