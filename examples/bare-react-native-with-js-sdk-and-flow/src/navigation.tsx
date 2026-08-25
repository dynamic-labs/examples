/**
 * Owns the app's screen-to-screen navigation via React Navigation's
 * native-stack, replacing the old App.tsx's single-component state machine
 * (see git history for AppContent's pre-redesign derived-state render
 * branching). Every screen renders its own Header (see components/Header.tsx)
 * instead of native-stack's built-in one, hence `headerShown: false` below.
 *
 * Before the stack even mounts, this also owns the one-time "is there a
 * session, and if so how far along is the user" check that used to be
 * implicit in AppContent's hook calls — now made explicit because it decides
 * which screen to land on first, not just what to render inline. Three
 * independent facts feed that decision:
 *  1. `useInitStatus()` — has the Dynamic client finished initializing at all?
 *  2. `useUser()` — is there a signed-in user (persisted session)?
 *  3. `useGetWalletAccounts()` — does that user already have a vault (WaaS
 *     embedded wallet)?
 * Until all three have resolved, SplashView is rendered directly (not as a
 * registered screen — there's nothing to navigate to yet).
 */
import {
  useGetWalletAccounts,
  useInitStatus,
  useUser,
} from '@dynamic-labs-sdk/react-hooks';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useMemo } from 'react';
import type { EvmWalletAccount } from '@dynamic-labs-sdk/evm';
import { SplashView } from './views/SplashView';
import { hasVault } from './utils/vault';
import { LoginRoute } from './routes/LoginRoute';
import { OtpRoute } from './routes/OtpRoute';
import { ProvisioningRoute } from './routes/ProvisioningRoute';
import { HomeRoute } from './routes/HomeRoute';
import { AccountRoute } from './routes/AccountRoute';
import { ConnectWalletRoute } from './routes/ConnectWalletRoute';
import { DepositRoute } from './routes/DepositRoute';
import { FlowStatusRoute } from './routes/FlowStatusRoute';
import { FundGasRoute } from './routes/FundGasRoute';
import { WithdrawRoute } from './routes/WithdrawRoute';
import { WithdrawAmountRoute } from './routes/WithdrawAmountRoute';
import type { OTPVerification } from '@dynamic-labs-sdk/client';

export type RootStackParamList = {
  Login: undefined;
  Otp: { email: string; otpVerification: OTPVerification };
  Provisioning: undefined;
  Home: undefined;
  Account: undefined;
  /** Shared across every ephemeral-connect call site — deposit, funding the
   * vault's withdrawal gas, and picking a withdrawal destination — see
   * ConnectWalletRoute.tsx and utils/connectEphemeralWallet.ts. */
  ConnectWallet: { purpose: 'deposit' | 'fund-gas' | 'withdraw-destination' };
  Deposit: { externalAccount: EvmWalletAccount };
  FlowStatus: { flowId: string; direction: 'deposit' | 'withdraw' };
  /** `reusableExternalAccount` carries the wallet connected for a gas
   * top-up forward, so this screen can offer to reuse it as the withdrawal
   * destination instead of forcing a fresh connect — see WithdrawRoute.tsx.
   * Absent on the first visit (from Home). */
  Withdraw: { reusableExternalAccount?: EvmWalletAccount } | undefined;
  FundGas: { vaultAddress: string; externalAccount: EvmWalletAccount };
  WithdrawAmount: {
    vaultAccount: EvmWalletAccount;
    externalAccount: EvmWalletAccount;
  };
};

export type RouteProps<Name extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Name>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  const { data: initStatus, error: initError } = useInitStatus();
  const { data: user, isLoading: isUserLoading } = useUser();
  const walletAccountsQuery = useGetWalletAccounts();

  const isReady =
    initStatus === 'finished' &&
    !isUserLoading &&
    !walletAccountsQuery.isLoading;

  // Computed once ready, not on every render of an already-mounted
  // Navigator: initialRouteName is only consulted the first time the
  // Navigator mounts, so recomputing it after that would do nothing anyway
  // — but memoizing keeps the intent explicit and avoids re-deriving
  // hasVault() (a fresh array filter/some) on unrelated re-renders.
  const initialRouteName = useMemo<keyof RootStackParamList>(() => {
    if (!user) {
      return 'Login';
    }
    return hasVault() ? 'Home' : 'Provisioning';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, user, walletAccountsQuery.data]);

  // A distinct, unrecoverable-from-here state, checked after (not instead
  // of) every hook above runs — without this, a failed init (bad/
  // unreachable environment config, offline cold boot) leaves `isReady`
  // false forever and the app stuck on the loading spinner indefinitely,
  // since nothing else ever flips `initStatus` away from 'failed'.
  if (initStatus === 'failed') {
    return (
      <SplashView
        error={initError?.message ?? 'Something went wrong starting the app.'}
      />
    );
  }

  if (!isReady) {
    return <SplashView message="Checking your session…" />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginRoute} />
        <Stack.Screen name="Otp" component={OtpRoute} />
        <Stack.Screen name="Provisioning" component={ProvisioningRoute} />
        <Stack.Screen name="Home" component={HomeRoute} />
        <Stack.Screen name="Account" component={AccountRoute} />
        <Stack.Screen name="ConnectWallet" component={ConnectWalletRoute} />
        <Stack.Screen name="Deposit" component={DepositRoute} />
        <Stack.Screen name="FlowStatus" component={FlowStatusRoute} />
        <Stack.Screen name="Withdraw" component={WithdrawRoute} />
        <Stack.Screen name="FundGas" component={FundGasRoute} />
        <Stack.Screen name="WithdrawAmount" component={WithdrawAmountRoute} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
