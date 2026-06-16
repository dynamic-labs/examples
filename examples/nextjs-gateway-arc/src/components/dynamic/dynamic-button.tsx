"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useWalletAccounts, useInitStatus } from "@dynamic-labs-sdk/react-hooks";
import { signInWithSocialRedirect, logout, sendEmailOTP, verifyOTP, type OTPVerification } from "@dynamic-labs-sdk/client";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { dynamicClient } from "@/lib/dynamic";

export default function DynamicButton() {
  const user = useUser();
  const accounts = useWalletAccounts();
  const initStatus = useInitStatus();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerification, setOtpVerification] = useState<OTPVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const evmWallet = accounts.find(isEvmWalletAccount) ?? null;
  const isLoggedIn = user !== null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowEmailInput(false);
        setShowOtpInput(false);
        setError(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (initStatus !== "finished") {
    return (
      <button disabled className="px-4 py-2 rounded bg-gray-200 text-gray-500 text-sm">
        Loading...
      </button>
    );
  }

  if (isLoggedIn) {
    const address = evmWallet?.address;
    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No wallet";
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          {shortAddress}
        </button>
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
            <button
              onClick={async () => {
                await logout(dynamicClient);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    );
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      await signInWithSocialRedirect({ provider: "google" }, dynamicClient);
    } catch {
      setError("Google login failed");
      setLoading(false);
    }
  }

  async function handleSendOTP() {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const verification = await sendEmailOTP({ email }, dynamicClient);
      setOtpVerification(verification);
      setShowOtpInput(true);
      setShowEmailInput(false);
    } catch {
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (!otpVerification || !otp) return;
    setLoading(true);
    setError(null);
    try {
      await verifyOTP({ otp }, otpVerification);
      setShowDropdown(false);
      setShowOtpInput(false);
    } catch {
      setError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
      >
        Log in or sign up
      </button>
      {showDropdown && !showEmailInput && !showOtpInput && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg z-50 p-2 flex flex-col gap-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full px-4 py-2 text-sm bg-white border rounded hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => setShowEmailInput(true)}
            className="w-full px-4 py-2 text-sm bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
          >
            Continue with Email
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
      {showDropdown && showEmailInput && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50 p-3 flex flex-col gap-2">
          <p className="text-sm font-medium">Enter your email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 text-sm border rounded"
            onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
          />
          <button
            onClick={handleSendOTP}
            disabled={loading || !email}
            className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
      {showDropdown && showOtpInput && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50 p-3 flex flex-col gap-2">
          <p className="text-sm font-medium">Enter OTP sent to {email}</p>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            className="w-full px-3 py-2 text-sm border rounded"
            onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
          />
          <button
            onClick={handleVerifyOTP}
            disabled={loading || !otp}
            className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
