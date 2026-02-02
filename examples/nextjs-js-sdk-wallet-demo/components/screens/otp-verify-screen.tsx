"use client";

import { useState } from "react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/error-message";
import { useVerifyOTP } from "@/hooks/use-mutations";
import type { OTPVerification } from "@/lib/dynamic-client";
import type { NavigationReturn } from "@/hooks/use-navigation";

interface OtpVerifyScreenProps {
  email: string;
  otpVerification: OTPVerification;
  navigation: NavigationReturn;
}

/**
 * OTP verification screen
 */
export function OtpVerifyScreen({
  email,
  otpVerification,
  navigation,
}: OtpVerifyScreenProps) {
  const [otp, setOtp] = useState("");
  const verifyOTP = useVerifyOTP();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    try {
      await verifyOTP.mutateAsync({ otpVerification, otp });
      // Auth successful - useNavigation will redirect to dashboard
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <WidgetCard
      title="Verify Email"
      subtitle={`Enter the code sent to ${email}`}
      onBack={navigation.goToAuth}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Verification Code"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength={6}
          autoFocus
          disabled={verifyOTP.isPending}
        />

        <Button
          type="submit"
          className="w-full"
          loading={verifyOTP.isPending}
          disabled={!otp.trim()}
        >
          Verify
        </Button>

        <ErrorMessage error={verifyOTP.error} />

        <p className="text-xs text-center text-(--widget-muted)">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={navigation.goToAuth}
            className="text-(--widget-accent) hover:underline"
          >
            Try again
          </button>
        </p>
      </form>
    </WidgetCard>
  );
}
