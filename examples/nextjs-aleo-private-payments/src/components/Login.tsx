"use client";

import { useState } from "react";
import { useSendEmailOTP, useVerifyOTP } from "@dynamic-labs-sdk/react-hooks";
import { INPUT, SUBMIT } from "@/lib/styles";

/**
 * Headless email-OTP sign-in. The JavaScript SDK ships no modal, so the flow is
 * two mutations: `useSendEmailOTP` returns the `OTPVerification` handle that
 * `useVerifyOTP` needs, and the emailed code goes in as `verificationToken`.
 */
export function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const {
    mutate: sendEmailOTP,
    data: otpVerification,
    isPending: isSending,
    error: sendError,
  } = useSendEmailOTP();

  const {
    mutate: verifyOTP,
    isPending: isVerifying,
    error: verifyError,
  } = useVerifyOTP();

  const error = sendError ?? verifyError;

  return (
    <div className="space-y-3">
      {!otpVerification && (
        <>
          <p className="text-sm text-muted">
            Sign in to get an embedded Aleo wallet.
          </p>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={INPUT}
          />
          <button
            onClick={() => sendEmailOTP({ email })}
            disabled={isSending || !email}
            className={SUBMIT}
          >
            {isSending ? "Sending…" : "Send code"}
          </button>
        </>
      )}

      {otpVerification && (
        <>
          <p className="text-sm text-muted">Enter the code sent to {email}.</p>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
            className={`${INPUT} text-center tracking-[0.3em]`}
          />
          <button
            onClick={() =>
              verifyOTP({ otpVerification, verificationToken: code })
            }
            disabled={isVerifying || code.length < 6}
            className={SUBMIT}
          >
            {isVerifying ? "Verifying…" : "Log in"}
          </button>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
