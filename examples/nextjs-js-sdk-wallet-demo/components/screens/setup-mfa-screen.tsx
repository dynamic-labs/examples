"use client";

/**
 * Setup MFA Screen
 *
 * Guides users through setting up TOTP (Time-based One-Time Password) MFA.
 * Shows a QR code that can be scanned with an authenticator app, plus
 * a fallback secret key for manual entry.
 *
 * Flow:
 * 1. Register new TOTP device -> get QR URI and secret
 * 2. Display QR code for user to scan
 * 3. User enters 6-digit code from authenticator app
 * 4. Verify code to complete setup
 * 5. Return to original flow (authorization or transaction)
 */

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Shield, ArrowLeft } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { LoadingCard } from "@/components/ui/loading-card";
import { ErrorCard } from "@/components/ui/error-card";
import { MfaCodeInput } from "@/components/ui/mfa-code-input";
import { CopyButton } from "@/components/ui/copy-button";
import { ErrorMessage } from "@/components/error-message";
import {
  registerTotpMfaDevice,
  authenticateTotpMfaDevice,
  getMfaDevices,
} from "@/lib/dynamic-client";
import { useMfaStatus } from "@/hooks/use-mfa-status";

type SetupStep = "loading" | "scan" | "verify" | "error";

interface SetupMfaScreenProps {
  /** Called when MFA setup is complete */
  onSuccess: () => void;
  /** Called when user cancels setup */
  onCancel: () => void;
}

/**
 * MFA Setup screen with QR code and verification
 */
export function SetupMfaScreen({ onSuccess, onCancel }: SetupMfaScreenProps) {
  const [step, setStep] = useState<SetupStep>("loading");
  const [qrUri, setQrUri] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { refetch: refetchMfaStatus } = useMfaStatus();

  const shieldIcon = (
    <Shield
      className="w-[18px] h-[18px] text-(--widget-accent)"
      strokeWidth={1.5}
    />
  );

  // Register TOTP device on mount (only if no device exists)
  useEffect(() => {
    const registerDevice = async () => {
      try {
        // Check if user already has a device
        const existingDevices = await getMfaDevices();
        if (existingDevices.length > 0) {
          // User already has a device - shouldn't be on this screen
          setError(
            new Error(
              "You already have an authenticator set up. Please use your existing authenticator app to enter the code.",
            ),
          );
          setStep("error");
          return;
        }

        const result = await registerTotpMfaDevice();
        setQrUri(result.uri);
        setSecret(result.secret);
        setStep("scan");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Provide a more helpful error message for "multiple devices" error
        if (errorMessage.includes("Multiple MFA devices")) {
          setError(
            new Error(
              "You already have an authenticator set up. Please use your existing authenticator app.",
            ),
          );
        } else {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to register MFA device"),
          );
        }
        setStep("error");
      }
    };
    registerDevice();
  }, []);

  // Handle verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    try {
      // Verify the code and create a single-use MFA token
      await authenticateTotpMfaDevice({
        code,
        createMfaTokenOptions: { singleUse: true },
      });
      // Refetch MFA status before navigating so destination screen has fresh data
      await refetchMfaStatus();
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Invalid code. Please try again."),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Loading state
  if (step === "loading") {
    return (
      <LoadingCard
        icon={shieldIcon}
        title="Set Up Authenticator"
        message="Preparing setup..."
        onClose={onCancel}
      />
    );
  }

  // Error state
  if (step === "error") {
    return (
      <ErrorCard
        icon={
          <Shield
            className="w-[18px] h-[18px] text-(--widget-error)"
            strokeWidth={1.5}
          />
        }
        title="Setup Error"
        error={error}
        onClose={onCancel}
      />
    );
  }

  // Main setup UI (scan + verify)
  return (
    <WidgetCard
      icon={shieldIcon}
      title="Set Up Authenticator"
      onClose={onCancel}
    >
      <form onSubmit={handleVerify} className="space-y-4">
        {/* QR Code with instructions */}
        <div className="flex flex-col items-center gap-3 p-4 bg-(--widget-row-bg) rounded-(--widget-radius)">
          <div className="bg-white p-3 rounded-lg">
            <QRCodeSVG
              value={qrUri}
              size={160}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-(--widget-muted) text-center">
            Scan with Google Authenticator, Authy, or similar app
          </p>
        </div>

        {/* Secret key fallback - collapsible */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-xs text-(--widget-muted) hover:text-(--widget-fg) transition-colors">
            <span>Can&apos;t scan? Enter key manually</span>
            <span className="text-[10px] group-open:hidden">Show</span>
            <span className="text-[10px] hidden group-open:inline">Hide</span>
          </summary>
          <div className="mt-2 p-2.5 bg-(--widget-row-bg) rounded-(--widget-radius)">
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-(--widget-fg) break-all flex-1">
                {secret}
              </code>
              <CopyButton
                text={secret}
                label="Copy secret"
                className="shrink-0"
              />
            </div>
          </div>
        </details>

        {/* Verification code input */}
        <MfaCodeInput
          label="Enter 6-digit code"
          value={code}
          onChange={setCode}
          disabled={isVerifying}
          autoFocus
        />

        <ErrorMessage error={error} />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={isVerifying}
            disabled={code.length !== 6}
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </form>
    </WidgetCard>
  );
}
