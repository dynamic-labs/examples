"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, Loader2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDynamicContext } from "@/lib/dynamic";
import { authFetch } from "@/lib/dynamic/auth-fetch";
import ResponseDisplay from "./components/response-display";

interface SignTestResult {
  success: boolean;
  signature?: string;
  error?: string;
  status?: number;
}

/**
 * Test component for 2-of-3 recovery-only mode (Enterprise feature).
 *
 * When recovery-only mode is enabled for an environment, the Dynamic
 * backend returns 403 on delegated sign message requests, restricting
 * delegated access to offline recovery operations only.
 *
 * This component sends a test sign request and displays whether the
 * mode is active (403) or inactive (sign succeeds).
 */
export default function RecoveryOnlyFlagTest() {
  const { user, primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<SignTestResult | null>(null);

  async function runTest() {
    if (!user?.userId || !primaryWallet?.chain || !primaryWallet?.address) {
      setTestResult({
        success: false,
        error: "Wallet not connected or user not logged in.",
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await authFetch(`/api/delegation/sign`, {
        method: "POST",
        body: JSON.stringify({
          address: primaryWallet.address,
          chain: primaryWallet.chain,
          message: "recovery-only-flag-test",
        }),
      });

      const data: SignTestResult = await response.json();
      setTestResult({ ...data, status: response.status });
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const flagIsActive = testResult?.status === 403;
  const signSucceeded = testResult?.success === true;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-dynamic" />
          <h3 className="font-semibold">
            2-of-3 Recovery-Only Mode (Enterprise Only)
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Enterprise feature — restricts signing to offline recovery only
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Explanation */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Environment ID:</strong>{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
              {process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID}
            </code>
          </p>
          <p>
            In 2-of-3 mode, a third key share is issued to the{" "}
            <strong>application owner</strong> for recovery purposes. When
            recovery-only mode is <strong>enabled</strong> (Enterprise), this
            share cannot be used for signing — the server returns{" "}
            <strong>403</strong> and only offline recovery operations are
            permitted.
          </p>
          <p>
            Click the button below to attempt a test sign and verify the mode is
            active.
          </p>
        </div>

        {/* Test Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={runTest}
          disabled={!user?.userId || !primaryWallet?.address || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Sign"
          )}
        </Button>

        {/* Result Banner */}
        {testResult && (
          <div
            className={`rounded-lg border p-4 space-y-2 ${
              flagIsActive
                ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
                : signSucceeded
                  ? "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30"
                  : "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
            }`}
          >
            <div className="flex items-start gap-3">
              {flagIsActive ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : signSucceeded ? (
                <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-medium ${
                    flagIsActive
                      ? "text-amber-800 dark:text-amber-200"
                      : signSucceeded
                        ? "text-green-800 dark:text-green-200"
                        : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {flagIsActive
                    ? "Recovery-Only Mode ACTIVE — Signing is blocked (403)"
                    : signSucceeded
                      ? "Recovery-Only Mode INACTIVE — Signing succeeded"
                      : `Error (${testResult.status ?? "unknown"})`}
                </h4>
                <p
                  className={`text-xs mt-1 ${
                    flagIsActive
                      ? "text-amber-700 dark:text-amber-300"
                      : signSucceeded
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {flagIsActive
                    ? "2-of-3 recovery-only mode is enabled for this environment. Only offline recovery operations are permitted — signing with this share is blocked."
                    : signSucceeded
                      ? "Signing is available. 2-of-3 recovery-only mode is not enabled for this environment."
                      : testResult.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Raw Response */}
        {testResult && (
          <ResponseDisplay
            result={
              testResult.success ? JSON.stringify(testResult, null, 2) : ""
            }
            error={
              testResult.success ? null : JSON.stringify(testResult, null, 2)
            }
            onClear={() => setTestResult(null)}
          />
        )}
      </div>
    </div>
  );
}
