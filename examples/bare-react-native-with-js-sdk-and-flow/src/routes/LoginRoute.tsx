/**
 * First screen: email-OTP login, replacing the old connect-external-wallet-
 * and-verify-it entry point entirely (see git history for ConnectWallet.tsx/
 * VerifyWallet.tsx) — this app's session is now a Dynamic email/OTP session,
 * not tied to any wallet at all. External wallets only ever get connected
 * ephemerally, per Deposit/Withdraw operation (see routes built in later
 * PRs of this stack).
 */
import { useSendEmailOTP } from '@dynamic-labs-sdk/react-hooks';
import { useState } from 'react';
import { LoginView } from '../views/LoginView';
import type { RouteProps } from '../navigation';

export function LoginRoute({ navigation }: RouteProps<'Login'>) {
  const [email, setEmail] = useState('');

  const {
    mutate: sendEmailOTP,
    isPending,
    error,
  } = useSendEmailOTP({
    mutateParams: {
      onSuccess: otpVerification => {
        navigation.navigate('Otp', { email, otpVerification });
      },
    },
  });

  return (
    <LoginView
      email={email}
      onChangeEmail={setEmail}
      onSubmit={() => sendEmailOTP({ email })}
      isSubmitting={isPending}
      error={error?.message}
    />
  );
}
