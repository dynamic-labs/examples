"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Check, Loader2, ShieldCheck, X } from "lucide-react";
import { useWallet } from "@/lib/providers";
import { dynamicClient } from "@/lib/dynamic-client";
import LoginForm from "@/components/dynamic/login-form";
import { Button } from "@/components/ui/button";

/**
 * Agent authorization page (self-hosted device-grant approval).
 *
 * An agent prints a link to here with ?code=XXXX-XXXX. The wallet owner signs in
 * with Dynamic, sees which wallet the agent wants to act on, and approves/denies.
 * Approval is verified server-side against their Dynamic JWT + wallet ownership.
 */
type Result = "approved" | "denied" | "error";

export default function AuthorizePage() {
  const { loggedIn } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const c = new URLSearchParams(window.location.search).get("code");
    setCode(c?.toUpperCase() ?? null);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Loader2 className="h-7 w-7 animate-spin text-dynamic" />
        </div>
      </Card>
    );
  }

  if (!code) {
    return (
      <Card title="Authorize your agent">
        <p className="text-sm text-muted-foreground">
          This link is missing its authorization code. Re-run your agent and open
          the link it prints.
        </p>
      </Card>
    );
  }

  if (!loggedIn) {
    return (
      <Card
        title="Approve agent access"
        subtitle="Sign in to confirm you own the wallet this agent wants to use."
      >
        <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Request code</span>
          <code className="ml-auto font-semibold tracking-widest">{code}</code>
        </div>
        <LoginForm />
      </Card>
    );
  }

  return <ApproveView code={code} />;
}

function ApproveView({ code }: Readonly<{ code: string }>) {
  const [address, setAddress] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/agent-grant/info?code=${encodeURIComponent(code)}`)
      .then(async (r) =>
        r.ok ? r.json() : Promise.reject(new Error((await r.json()).error))
      )
      .then((d) => setAddress(d.address))
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "This code is invalid or expired")
      );
  }, [code]);

  const respond = useCallback(
    async (action: "approve" | "deny") => {
      setBusy(true);
      setActionError(null);
      try {
        const res = await fetch("/api/agent-grant/approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Cookie-based sessions send the JWT automatically; for token-based
            // sessions attach it explicitly. The server accepts either.
            ...(dynamicClient.token
              ? { Authorization: `Bearer ${dynamicClient.token}` }
              : {}),
          },
          body: JSON.stringify({ userCode: code, action }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Couldn't complete the request");
        }
        setResult(action === "approve" ? "approved" : "denied");
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
    },
    [code]
  );

  if (result === "approved") {
    return (
      <Card title="Agent approved">
        <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm text-muted-foreground">
            Your agent is authorized and can continue. You can close this tab.
          </p>
        </div>
      </Card>
    );
  }

  if (result === "denied") {
    return (
      <Card title="Request denied">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-muted-foreground">
            The agent request was denied. You can close this tab.
          </p>
        </div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card title="Request unavailable">
        <p className="text-sm text-muted-foreground">{loadError}</p>
      </Card>
    );
  }

  return (
    <Card
      title="Approve agent access"
      subtitle="An agent is requesting permission to pay for services from this wallet on your behalf."
    >
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-dynamic/20 bg-dynamic/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-dynamic" />
        <p className="text-sm text-muted-foreground">
          Only approve if you started this agent. Approving lets it spend from
          your balance until the session expires.
        </p>
      </div>

      <div className="mb-5 rounded-xl border bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground">Wallet</p>
        <code className="block truncate text-sm font-medium">
          {address ?? "…"}
        </code>
        <p className="mt-2 text-xs text-muted-foreground">Request code</p>
        <code className="text-sm font-semibold tracking-widest">{code}</code>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={busy || !address}
          onClick={() => respond("deny")}
        >
          Deny
        </Button>
        <Button
          className="flex-1 bg-dynamic text-white hover:bg-dynamic/90"
          disabled={busy || !address}
          onClick={() => respond("approve")}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Approve
            </span>
          )}
        </Button>
      </div>
      {actionError && <p className="mt-3 text-sm text-red-500">{actionError}</p>}
    </Card>
  );
}

function Card({
  children,
  title,
  subtitle,
}: Readonly<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}>) {
  return (
    <main className="w-full max-w-md">
      <div className="rounded-2xl border bg-card p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-dynamic/10">
            <Bot className="h-5 w-5 text-dynamic" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Agent Wallet</span>
        </div>
        {title && <h1 className="text-xl font-semibold tracking-tight">{title}</h1>}
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
        <div className={title ? "mt-6" : ""}>{children}</div>
      </div>
    </main>
  );
}
