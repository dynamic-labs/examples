"use client";

/**
 * JWT Generator Page
 *
 * Clean generate-focused card with a right flyout for setup instructions.
 * The setup flyout contains prerequisites, ngrok detection, and dashboard config.
 *
 * Dev-only utility — not part of the Dynamic SDK integration.
 *
 * @see https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-usage
 */

import { useState, useEffect } from "react";
import {
  KeyRound,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Wifi,
  WifiOff,
  BookOpen,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PoweredByFooter } from "@/components/powered-by-footer";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJwtAuth } from "@/hooks/use-mutations";

export default function JwtGeneratorPage() {
  const [sub, setSub] = useState(() => crypto.randomUUID());
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const router = useRouter();
  const jwtAuth = useJwtAuth();

  /** Generate a JWT token and return it (or null on error) */
  const generateToken = async (): Promise<string | null> => {
    setError("");
    setToken("");

    const res = await fetch("/api/dev/jwt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sub: sub.trim() || undefined,
        email: email.trim() || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to generate JWT");
      return null;
    }

    setToken(data.token);
    return data.token;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateToken();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAndSignIn = async () => {
    setIsSigningIn(true);
    try {
      const jwt = await generateToken();
      if (!jwt) return;
      await jwtAuth.mutateAsync(jwt);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const decoded = token ? decodeJwt(token) : null;
  const isConfigError = error?.includes("not configured");

  return (
    <>
      <div className="min-h-screen flex w-full bg-(--widget-page-bg)">
        {/* Left: card (pushed left when panel open) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 min-w-0">
          <div className="w-full max-w-[400px]">
            <WidgetCard
              title="JWT Generator"
              subtitle="External JWT auth testing"
            >
              <div className="space-y-4">
                {/* Form */}
                <div className="space-y-3">
                  <Input
                    label="Subject (user ID)"
                    value={sub}
                    onChange={(e) => setSub(e.target.value)}
                    placeholder="e.g. user-123"
                  />
                  <Input
                    label={
                      <span className="flex items-center gap-1">
                        Email
                        <span className="text-(--widget-muted) font-normal">
                          (optional)
                        </span>
                      </span>
                    }
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={handleGenerate}
                      loading={isGenerating}
                      disabled={isSigningIn}
                    >
                      <KeyRound className="w-4 h-4" />
                      Generate
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleGenerateAndSignIn}
                      loading={isSigningIn}
                      disabled={isGenerating}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Generate & Sign In
                    </Button>
                  </div>
                  {error && (
                    <div className="text-xs text-(--widget-error) bg-red-50 rounded-(--widget-radius) px-3 py-2 space-y-1">
                      <p>{error}</p>
                      {isConfigError && (
                        <button
                          type="button"
                          onClick={() => setShowSetup(true)}
                          className="text-(--widget-primary) hover:underline cursor-pointer"
                        >
                          View setup instructions
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Token output */}
                {token && (
                  <>
                    <div className="h-px bg-(--widget-border)" />

                    <div className="space-y-3">
                      <div className="relative">
                        <pre className="text-[11px] font-mono leading-relaxed bg-(--widget-row-bg) border border-(--widget-border) rounded-(--widget-radius) p-3 pr-10 overflow-x-auto whitespace-pre-wrap break-all text-(--widget-fg) max-h-24 overflow-y-auto">
                          {token}
                        </pre>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="absolute top-2 right-2 p-1.5 rounded-(--widget-radius) bg-(--widget-bg) border border-(--widget-border) hover:bg-(--widget-row-hover) transition-colors cursor-pointer"
                          aria-label="Copy token"
                        >
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-(--widget-muted)" />
                          )}
                        </button>
                      </div>

                      {decoded && (
                        <details className="group">
                          <summary className="text-[11px] text-(--widget-muted) cursor-pointer hover:text-(--widget-fg) transition-colors">
                            View decoded payload
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div>
                              <p className="text-[10px] font-medium text-(--widget-muted) uppercase tracking-wider mb-1">
                                Header
                              </p>
                              <pre className="text-[11px] font-mono bg-(--widget-row-bg) border border-(--widget-border) rounded-(--widget-radius) p-2 overflow-x-auto text-(--widget-fg)">
                                {JSON.stringify(decoded.header, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-(--widget-muted) uppercase tracking-wider mb-1">
                                Payload
                              </p>
                              <pre className="text-[11px] font-mono bg-(--widget-row-bg) border border-(--widget-border) rounded-(--widget-radius) p-2 overflow-x-auto text-(--widget-fg)">
                                {JSON.stringify(decoded.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      )}
                    </div>

                    <div className="h-px bg-(--widget-border)" />

                    <a
                      href="/"
                      className="flex items-center justify-center gap-1 text-[11px] text-(--widget-muted) hover:text-(--widget-fg) transition-colors"
                    >
                      Go to Sign In
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </WidgetCard>
          </div>
          <PoweredByFooter />
        </div>

        {/* Setup panel: full-page overlay on mobile, inline side panel on md+ */}
        {showSetup && (
          <div className="fixed inset-0 z-40 flex flex-col bg-(--widget-bg) md:static md:inset-auto md:z-auto md:w-full md:max-w-[420px] md:min-w-[320px] md:border-l md:border-(--widget-border)">
            <SetupFlyout onClose={() => setShowSetup(false)} />
          </div>
        )}
      </div>

      {/* Top-right trigger (hidden when panel is open — panel X handles close) */}
      {!showSetup && (
        <button
          type="button"
          onClick={() => setShowSetup(true)}
          className="fixed top-4 right-4 flex items-center gap-2 rounded-lg border border-(--widget-border) bg-(--widget-bg) px-3 py-2 text-xs font-medium text-(--widget-muted) shadow-sm hover:text-(--widget-fg) hover:bg-(--widget-muted) transition-colors cursor-pointer"
          aria-label="Open setup guide"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Setup Guide
        </button>
      )}
    </>
  );
}

// =============================================================================
// SETUP FLYOUT
// =============================================================================

function SetupFlyout({ onClose }: { onClose: () => void }) {
  const [ngrokUrl, setNgrokUrl] = useState<string | null>(null);
  const [ngrokDetecting, setNgrokDetecting] = useState(false);
  const [ngrokError, setNgrokError] = useState("");
  const [port, setPort] = useState("3000");

  useEffect(() => {
    setPort(window.location.port || "3000");
    detectNgrok();
  }, []);

  const detectNgrok = async () => {
    setNgrokDetecting(true);
    setNgrokError("");
    try {
      const res = await fetch("/api/dev/ngrok");
      const data = await res.json();
      if (res.ok && data.jwksUrl) {
        setNgrokUrl(data.jwksUrl);
      } else {
        setNgrokUrl(null);
        setNgrokError(data.error || "Not detected");
      }
    } catch {
      setNgrokUrl(null);
      setNgrokError("Failed to check ngrok");
    } finally {
      setNgrokDetecting(false);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-(--widget-border) shrink-0 bg-(--widget-bg)">
        <div>
          <h2 className="text-sm font-medium text-(--widget-fg)">
            Setup Instructions
          </h2>
          <p className="text-xs text-(--widget-muted)">
            Configure external JWT authentication
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-(--widget-radius) hover:bg-(--widget-row-hover) transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-(--widget-muted)" />
        </button>
      </div>
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-5">
          {/* Docs link */}
          <p className="text-xs text-(--widget-muted) leading-relaxed">
            For the full guide, see{" "}
            <a
              href="https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--widget-primary) hover:underline inline-flex items-center gap-0.5"
            >
              Dynamic docs
              <ExternalLink className="w-3 h-3" />
            </a>{" "}
            or{" "}
            <code className="text-[11px] font-mono bg-(--widget-row-bg) px-1 py-0.5 rounded text-(--widget-fg)">
              docs/external-jwt-auth.md
            </code>
          </p>

          {/* Step 1 */}
          <div className="space-y-2">
            <StepHeader number={1} title="Generate keys" />
            <div className="pl-7 space-y-1.5">
              <CodeBlock>npx tsx scripts/generate-keypair.ts</CodeBlock>
              <p className="text-xs text-(--widget-muted)">
                Copy the output into{" "}
                <code className="text-[11px] font-mono bg-(--widget-row-bg) px-1 py-0.5 rounded text-(--widget-fg)">
                  .env.local
                </code>{" "}
                and restart the dev server.
              </p>
            </div>
          </div>

          <div className="h-px bg-(--widget-border)" />

          {/* Step 2 */}
          <div className="space-y-2">
            <StepHeader number={2} title="Expose JWKS via ngrok" />
            <div className="pl-7 space-y-2">
              <CodeBlock>{`ngrok http ${port}`}</CodeBlock>
              {ngrokUrl ? (
                <div className="flex items-start gap-1.5 text-xs text-green-600">
                  <Wifi className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="break-all">
                    Detected:{" "}
                    <code className="font-mono text-[11px]">{ngrokUrl}</code>
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs text-(--widget-muted)">
                    Dynamic must reach your JWKS endpoint publicly.
                  </p>
                  {ngrokError && (
                    <div className="flex items-center gap-1.5 text-xs text-(--widget-muted)">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>{ngrokError}</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={detectNgrok}
                    loading={ngrokDetecting}
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    Detect ngrok
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-(--widget-border)" />

          {/* Step 3 */}
          <div className="space-y-2">
            <StepHeader number={3} title="Configure Dynamic dashboard" />
            <div className="pl-7 space-y-2">
              <p className="text-xs text-(--widget-muted)">
                Go to{" "}
                <a
                  href="https://app.dynamic.xyz/dashboard/developer/third-party-auth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--widget-primary) hover:underline inline-flex items-center gap-0.5"
                >
                  External Authentication
                  <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and enter:
              </p>
              <DashboardField
                label="iss"
                value="https://demo-jwt-provider.example.com"
              />
              <DashboardField
                label="jwksUrl"
                value={
                  ngrokUrl || `https://<ngrok-id>.ngrok-free.app/api/dev/jwks`
                }
                note={
                  ngrokUrl
                    ? "Auto-detected from ngrok"
                    : "Replace <ngrok-id> with your ngrok subdomain"
                }
              />
              <DashboardField label="aud" value="(leave empty)" />
            </div>
          </div>

          <div className="h-px bg-(--widget-border)" />

          {/* Step 4 */}
          <div className="space-y-2">
            <StepHeader number={4} title="Enable the toggle" />
            <p className="pl-7 text-xs text-(--widget-muted)">
              Turn on the <strong>External Authentication</strong> toggle in the
              dashboard, then restart your dev server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function StepHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-(--widget-primary) text-white text-[10px] font-bold shrink-0">
        {number}
      </span>
      <h3 className="text-xs font-medium text-(--widget-fg)">{title}</h3>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="text-[11px] font-mono bg-(--widget-row-bg) border border-(--widget-border) rounded-(--widget-radius) px-3 py-2 text-(--widget-fg) overflow-x-auto">
      {children}
    </pre>
  );
}

function DashboardField({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] font-mono font-medium text-(--widget-fg) shrink-0 w-14">
          {label}
        </span>
        <code className="text-[11px] font-mono bg-(--widget-row-bg) border border-(--widget-border) rounded px-1.5 py-0.5 text-(--widget-fg) break-all">
          {value}
        </code>
      </div>
      {note && (
        <p className="text-[10px] text-(--widget-muted) pl-16">{note}</p>
      )}
    </div>
  );
}

function decodeJwt(token: string): { header: object; payload: object } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    if (payload.iat)
      payload.iat = `${payload.iat} (${new Date(payload.iat * 1000).toISOString()})`;
    if (payload.exp)
      payload.exp = `${payload.exp} (${new Date(payload.exp * 1000).toISOString()})`;

    return { header, payload };
  } catch {
    return null;
  }
}
