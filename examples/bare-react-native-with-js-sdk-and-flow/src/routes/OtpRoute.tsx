/**
 * Second (and last) auth screen: verifies the code sent by LoginRoute.
 * Once verified, this becomes an *authenticated* session — the same "does
 * this user have a vault yet" check Navigation.tsx uses to pick an initial
 * route on cold boot decides where this screen sends a freshly-logged-in
 * user, via `navigation.reset` rather than `navigate` so Login/Otp aren't
 * left sitting in the back-stack behind a real session.
 */
import { useSendEmailOTP, useVerifyOTP } from '@dynamic-labs-sdk/react-hooks';
import { useEffect, useRef, useState } from 'react';
import { OtpView } from '../views/OtpView';
import { hasVault } from '../utils/vault';
import type { RouteProps } from '../navigation';

const RESEND_COOLDOWN_SECONDS = 30;

export function OtpRoute({ navigation, route }: RouteProps<'Otp'>) {
  const { email } = route.params;
  const [otpVerification, setOtpVerification] = useState(
    route.params.otpVerification,
  );
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    cooldownIntervalRef.current = setInterval(() => {
      setCooldown(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  const {
    mutate: verifyOTP,
    isPending: isVerifying,
    error: verifyError,
  } = useVerifyOTP({
    mutateParams: {
      onSuccess: () => {
        // navigation.reset (not navigate): once verified this is a real
        // session, and Login/Otp have nothing left to offer a back-gesture
        // into — same route Navigation.tsx's own cold-boot check would send
        // a returning, already-provisioned user to.
        navigation.reset({
          index: 0,
          routes: [{ name: hasVault() ? 'Home' : 'Provisioning' }],
        });
      },
    },
  });

  const {
    mutate: resendEmailOTP,
    isPending: isResending,
    error: resendError,
  } = useSendEmailOTP({
    mutateParams: {
      onSuccess: freshOtpVerification => {
        setOtpVerification(freshOtpVerification);
        setCode('');
        setCooldown(RESEND_COOLDOWN_SECONDS);
      },
    },
  });

  return (
    <OtpView
      email={email}
      code={code}
      onChangeCode={setCode}
      onSubmit={() => verifyOTP({ otpVerification, verificationToken: code })}
      onResend={() => resendEmailOTP({ email })}
      onBack={() => navigation.goBack()}
      isSubmitting={isVerifying}
      isResending={isResending}
      error={verifyError?.message ?? resendError?.message}
      resendCooldownSeconds={cooldown}
    />
  );
}
