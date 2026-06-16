"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useWalletAccounts, useInitStatus } from "@dynamic-labs-sdk/react-hooks";
import {
  signInWithSocialRedirect,
  logout,
  sendEmailOTP,
  verifyOTP,
  type OTPVerification,
} from "@dynamic-labs-sdk/client";
import { isSolanaWalletAccount } from "@dynamic-labs-sdk/solana";
import { dynamicClient } from "@/lib/dynamic";

type AuthStep = "menu" | "email" | "otp";

function truncate(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function truncateEmail(email: string, max = 22) {
  if (email.length <= max) return email;
  const [local, domain] = email.split("@");
  if (!domain) return `${email.slice(0, max - 1)}…`;
  const keep = Math.max(3, max - domain.length - 2);
  return `${local.slice(0, keep)}…@${domain}`;
}

function AddressRow({
  label,
  addr,
  copied,
  onCopy,
}: {
  label: string;
  addr: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-100">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
        <p className="font-mono text-xs text-gray-900">{truncate(addr)}</p>
      </div>
      <button
        onClick={onCopy}
        className="cursor-pointer p-1 rounded hover:bg-gray-200 text-gray-500"
        title="Copy address"
      >
        {copied ? (
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function DynamicButton() {
  const user = useUser();
  const accounts = useWalletAccounts();
  const initStatus = useInitStatus();
  const loggedIn = user !== null;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<AuthStep>("menu");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerification, setOtpVerification] = useState<OTPVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setStep("menu");
        setError(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const solanaWallet = accounts.find(isSolanaWalletAccount);

  const resetAuth = () => {
    setEmail("");
    setOtp("");
    setOtpVerification(null);
  };

  const copy = (addr: string, key: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithSocialRedirect(
        { provider: "google", redirectUrl: globalThis.location.origin },
        dynamicClient
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      setOtpVerification(await sendEmailOTP({ email }, dynamicClient));
      setStep("otp");
    } catch {
      setError("Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || !otpVerification) return;
    setLoading(true);
    setError(null);
    try {
      await verifyOTP({ otpVerification, verificationToken: otp }, dynamicClient);
      setOpen(false);
      setStep("menu");
      resetAuth();
    } catch {
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initStatus !== "finished") {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-400 bg-white opacity-70 cursor-not-allowed"
      >
        <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading...
      </button>
    );
  }

  if (loggedIn) {
    const primary = solanaWallet?.address ?? "";
    const userEmail = user?.email ?? "";
    const label = userEmail ? truncateEmail(userEmail) : truncate(primary);
    const initials = (userEmail ? userEmail.slice(0, 2) : primary.slice(0, 2)).toUpperCase();

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            {initials}
          </span>
          <span className="max-w-[180px] truncate">{label}</span>
        </button>
        {open && (
          <div className="absolute right-0 mt-1 min-w-[16rem] rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-gray-200">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email ?? "—"}</p>
            </div>
            <div className="p-2 space-y-1">
              {accounts.length === 0 ? (
                <div className="flex items-center gap-2 px-2 py-2 text-xs text-gray-500">
                  <svg className="animate-spin h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Setting up your wallets...
                </div>
              ) : (
                solanaWallet && (
                  <AddressRow
                    label="Solana"
                    addr={solanaWallet.address}
                    copied={copied === "sol"}
                    onCopy={() => copy(solanaWallet.address, "sol")}
                  />
                )
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                logout(dynamicClient);
              }}
              className="cursor-pointer w-full text-left px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-200 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          setStep("menu");
          setError(null);
        }}
        className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        Log in or sign up
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-lg z-50 p-4 space-y-3">
          {error && (
            <p className="text-xs text-red-600 text-center">{error}</p>
          )}

          {step === "menu" && (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {loading ? "Connecting..." : "Continue with Google"}
              </button>
              <button
                onClick={() => setStep("email")}
                disabled={loading}
                className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Continue with Email
              </button>
            </>
          )}

          {step === "email" && (
            <>
              <button
                onClick={() => {
                  setStep("menu");
                  setError(null);
                }}
                className="cursor-pointer text-xs flex items-center gap-1 text-gray-500"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <p className="text-xs font-medium text-gray-900">Enter your email</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-300"
                onKeyDown={(e) => e.key === "Enter" && handleEmail()}
              />
              <button
                onClick={handleEmail}
                disabled={loading || !email}
                className="cursor-pointer w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Send Code
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <button
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
                className="cursor-pointer text-xs flex items-center gap-1 text-gray-500"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <p className="text-xs text-gray-500">
                Code sent to <span className="font-medium text-gray-900">{email}</span>
              </p>
              <input
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 text-center tracking-widest outline-none focus:ring-2 focus:ring-blue-300"
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
              <button
                onClick={handleVerify}
                disabled={loading || otp.length < 6}
                className="cursor-pointer w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Verify
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
