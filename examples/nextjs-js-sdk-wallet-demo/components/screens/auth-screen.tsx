"use client";

/**
 * Authentication screen — orchestrates available sign-in methods
 *
 * Each auth method is a self-contained section that checks its own
 * dashboard configuration and returns null if not enabled.
 *
 * @see https://www.dynamic.xyz/docs/javascript/authentication-methods/email
 * @see https://www.dynamic.xyz/docs/javascript/authentication-methods/social
 * @see https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-usage
 */

import { useState } from "react";
import { WidgetCard } from "@/components/ui/widget-card";
import { EmailOtpSection } from "@/components/auth/email-otp-section";
import {
  SocialProvidersSection,
  SocialAuthCompletingCard,
} from "@/components/auth/social-providers-section";
import { JwtAuthSection } from "@/components/auth/jwt-auth-section";
import type { NavigationReturn } from "@/hooks/use-navigation";

interface AuthScreenProps {
  navigation: NavigationReturn;
}

/**
 * Authentication screen with conditional email OTP, social OAuth, and external JWT options
 */
export function AuthScreen({ navigation }: AuthScreenProps) {
  const [isCompletingOAuth, setIsCompletingOAuth] = useState(false);

  if (isCompletingOAuth) return <SocialAuthCompletingCard />;

  return (
    <WidgetCard title="Sign In" subtitle="Choose how to authenticate">
      <div className="space-y-4">
        <EmailOtpSection navigation={navigation} />
        <SocialProvidersSection onCompletingOAuth={setIsCompletingOAuth} />
        <JwtAuthSection />
      </div>
    </WidgetCard>
  );
}
