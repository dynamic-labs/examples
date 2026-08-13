/**
 * Account screen: signed-in email + Log out. Reached from Home's header
 * icon button (see HomeView.tsx) — this is where session control lives now
 * that there's no persistent external-wallet chip to attach a Logout link
 * to (the old ConnectedWallet.tsx; see git history).
 */
import { useLogout, useUser } from '@dynamic-labs-sdk/react-hooks';
import { AccountView } from '../views/AccountView';
import type { RouteProps } from '../navigation';

export function AccountRoute({ navigation }: RouteProps<'Account'>) {
  const { data: user } = useUser();

  const {
    mutate: logOut,
    isPending: isLoggingOut,
    error,
  } = useLogout({
    mutateParams: {
      // navigation.reset, not goBack: once logged out, Home/Account have
      // nothing left to show — send the user back to a fresh Login with no
      // way to swipe/back into the now-dead session's screens.
      onSuccess: () =>
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
    },
  });

  return (
    <AccountView
      email={user?.email ?? ''}
      onLogout={() => logOut()}
      onBack={() => navigation.goBack()}
      isLoggingOut={isLoggingOut}
      error={error?.message}
    />
  );
}
