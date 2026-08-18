"use client";

import { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useSendEmailOTP, useVerifyOTP } from "@dynamic-labs-sdk/react-hooks";

const INPUT =
  "w-full px-3 py-2.5 text-sm rounded-lg border border-line outline-none focus:border-brand transition-colors";

const SUBMIT =
  "cursor-pointer w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg bg-brand hover:bg-brand/90 text-white transition-colors disabled:bg-line disabled:text-muted disabled:cursor-not-allowed";

/**
 * Headless email-OTP sign-in. The JavaScript SDK ships no modal, so the whole
 * flow is two mutations: `useSendEmailOTP` returns the `OTPVerification` handle
 * that `useVerifyOTP` needs, and the code goes in as `verificationToken`.
 */
export function Login({ onDone }: { onDone?: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const {
    mutate: sendEmailOTP,
    data: otpVerification,
    isPending: isSending,
    error: sendError,
    reset: resetSend,
  } = useSendEmailOTP();

  const {
    mutate: verifyOTP,
    isPending: isVerifying,
    error: verifyError,
    reset: resetVerify,
  } = useVerifyOTP();

  const error = sendError ?? verifyError;

  if (!otpVerification) {
    return (
      <div className="space-y-3">
        <p className="text-sm">Enter your email</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={INPUT}
          onKeyDown={(e) => e.key === "Enter" && email && sendEmailOTP({ email })}
        />
        <button
          onClick={() => sendEmailOTP({ email })}
          disabled={isSending || !email}
          className={SUBMIT}
        >
          {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send Code
        </button>
        {error && (
          <p className="text-xs text-red-600 text-center">{error.message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          resetSend();
          // Also drop any stale verification error, or it would follow the
          // user back onto the email screen.
          resetVerify();
          setCode("");
        }}
        className="cursor-pointer text-xs flex items-center gap-1 text-muted hover:text-ink transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Back
      </button>
      <p className="text-xs text-muted">
        Code sent to <span className="text-ink">{email}</span>
      </p>
      <input
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="Enter 6-digit code"
        className={`${INPUT} font-mono tracking-[0.4em] text-center`}
      />
      <button
        onClick={() =>
          verifyOTP(
            { otpVerification, verificationToken: code },
            { onSuccess: () => onDone?.() },
          )
        }
        disabled={isVerifying || code.length < 6}
        className={SUBMIT}
      >
        {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
        Verify
      </button>
      {error && (
        <p className="text-xs text-red-600 text-center">{error.message}</p>
      )}
    </div>
  );
}
