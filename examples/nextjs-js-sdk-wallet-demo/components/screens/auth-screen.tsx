"use client";

import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/error-message";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useSendEmailOTP, useGoogleAuth } from "@/hooks/use-mutations";
import {
  detectOAuthRedirect,
  completeSocialAuthentication,
} from "@/lib/dynamic-client";
import type { NavigationReturn } from "@/hooks/use-navigation";

interface AuthScreenProps {
  navigation: NavigationReturn;
}

/**
 * Authentication screen with email OTP and Google OAuth options
 */
export function AuthScreen({ navigation }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [isCompletingOAuth, setIsCompletingOAuth] = useState(false);
  const [oauthError, setOauthError] = useState<Error | null>(null);

  const sendOTP = useSendEmailOTP();
  const googleAuth = useGoogleAuth();

  // Handle OAuth redirect on mount
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      try {
        const isReturning = await detectOAuthRedirect({
          url: new URL(window.location.href),
        });

        if (isReturning) {
          setIsCompletingOAuth(true);
          await completeSocialAuthentication({
            url: new URL(window.location.href),
          });
          // Auth successful - useNavigation will redirect to dashboard
        }
      } catch (error) {
        console.error("OAuth redirect error:", error);
        setOauthError(error as Error);
      } finally {
        setIsCompletingOAuth(false);
      }
    };

    handleOAuthRedirect();
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      const otpVerification = await sendOTP.mutateAsync(email);
      navigation.goToOtpVerify(email, otpVerification);
    } catch {
      // Error handled by mutation
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleAuth.mutateAsync();
    } catch {
      // Error handled by mutation
    }
  };

  if (isCompletingOAuth) {
    return (
      <WidgetCard title="Signing In" subtitle="Completing authentication...">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Sign In" subtitle="Choose how to authenticate">
      <div className="space-y-4">
        {/* Email OTP Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={sendOTP.isPending}
          />
          <Button
            type="submit"
            className="w-full"
            loading={sendOTP.isPending}
            disabled={!email.trim()}
          >
            <Mail className="w-4 h-4" />
            Continue with Email
          </Button>
          <ErrorMessage error={sendOTP.error} />
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-(--widget-border)" />
          <span className="text-xs text-(--widget-muted)">or</span>
          <div className="flex-1 h-px bg-(--widget-border)" />
        </div>

        {/* Google OAuth */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleGoogleSignIn}
          loading={googleAuth.isPending}
        >
          <GoogleIcon className="w-4 h-4" />
          Continue with Google
        </Button>
        <ErrorMessage error={googleAuth.error || oauthError} />
      </div>
    </WidgetCard>
  );
}
