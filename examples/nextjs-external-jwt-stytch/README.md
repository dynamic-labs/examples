# Next.js External JWT Authentication with Stytch + Dynamic

## Overview

This example demonstrates **external JWT authentication** using Stytch's session JWT to authenticate with **Dynamic** and automatically provision **embedded wallets** in a Next.js application using the [App Router](https://nextjs.org/docs/app/building-your-application/routing#the-app-router).

**Note**: This example is derived from the original [Stytch Next.js App Router example](https://github.com/stytchauth/stytch-nextjs-app-router-example) and has been adapted to demonstrate the external JWT authentication pattern with Dynamic embedded wallets.

- **Auth provider**: Stytch (Email Magic Links)
- **Wallets**: Dynamic Embedded Wallets (EVM via `@dynamic-labs/ethereum`)
- **Integration**: The Stytch session JWT is read client-side and used to sign into Dynamic via `signInWithExternalJwt`, keeping the Stytch and Dynamic sessions in sync.

In Next.js 13's App Router, you may use both [Client](https://nextjs.org/docs/getting-started/react-essentials#client-components) and [Server](https://nextjs.org/docs/getting-started/react-essentials#server-components) components. This example primarily uses Client components; you can see the auth handler in `/src/components/Authenticate.tsx`.

## How it works

- After a user completes Stytch Email Magic Link authentication, Stytch creates a session and sets a `stytch_session_jwt` cookie.
- The `StytchDynamicBridge` component reads the Stytch session JWT and calls Dynamic's `signInWithExternalJwt`, which authenticates the user with Dynamic and enables Embedded Wallets.
- When the Stytch session ends, the bridge logs the user out of Dynamic to keep sessions aligned.

Key files:

- `src/components/Authenticate.tsx`: Completes the Stytch Magic Link flow and establishes a Stytch session.
- `src/components/StytchProvider.tsx`: Contains the `StytchDynamicBridge` that syncs Stytch → Dynamic by passing the Stytch session JWT to Dynamic.
- `src/components/dynamicClient.ts`: Provides a singleton Dynamic client instance with SSR compatibility and lazy initialization.
- `src/hooks/useDynamicClientState.ts`: Generic hook for subscribing to Dynamic client state changes with reactive updates.
- `src/hooks/useDynamicUser.ts`: Hook that provides reactive access to the current authenticated Dynamic user.
- `src/hooks/useDynamicWallets.ts`: Hook that provides reactive access to the user's Dynamic wallet accounts.
- `src/app/layout.tsx`: Wraps the app with `StytchProvider` for authentication.

## Set up

Follow the steps below to run this application using your own Stytch and Dynamic credentials.

### In the Stytch Dashboard

1. Create a [Stytch](https://stytch.com/) account. Once your account is set up a Project called "My first project" will be automatically created for you.
2. Within your new Project, navigate to [SDK configuration](https://stytch.com/dashboard/sdk-configuration), and click **Enable SDK**.
3. Navigate to [API Keys](https://stytch.com/dashboard/api-keys). You will need the `project_id`, `secret`, and `public_token` values later on.

### In the Dynamic Dashboard

1. Create or sign in to your Dynamic account and select a project.
2. Copy your project's **Environment ID** (e.g. `env-live-xxxx` or `env-test-xxxx`). You'll set this as `NEXT_PUBLIC_DYNAMIC_ENV_ID`.
3. Ensure Embedded Wallets are enabled for your environment and that the EVM connectors you want are selected.

### On your machine

Clone the project and install dependencies:

```bash
git clone https://github.com/dynamic-labs/examples.git
cd examples/nextjs-external-jwt-stytch
# Install dependencies, using pnpm.
pnpm i
```

Create `.env.local` by copying the template:

```bash
cp .env.template .env.local
```

Open `.env.local` and set the variables below using your Stytch and Dynamic credentials. Leave `STYTCH_PROJECT_ENV` as `test` for local development.

```
# Stytch
STYTCH_PROJECT_ENV=test
STYTCH_PROJECT_ID=project-test-00000000-0000-1234-abcd-abcdef1234
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=public-token-test-abcd123-0000-0000-abcd-1234567abc
STYTCH_SECRET=secret-test-12345678901234567890abcdabcd

# Dynamic
NEXT_PUBLIC_DYNAMIC_ENV_ID=env-test-xxxxxxxxxxxxxxxx
```

## Running locally

After completing the setup, run the app:

```bash
pnpm run dev
```

The application will be available at `http://localhost:3000`.

You'll be able to log in with Stytch Email Magic Links. On success, the app uses **external JWT authentication** to pass the Stytch session JWT to Dynamic, authenticating the user and automatically creating their Embedded Wallet.

## Get help and join the community

- **Dynamic Support**: Visit the [Dynamic Documentation](https://www.dynamic.xyz/docs/javascript-sdk) or [Join our Slack](https://www.dynamic.xyz/join-slack).
- **Stytch Support**: Check out the [Stytch Documentation](https://stytch.com/docs/) or [Stytch Forum](https://forum.stytch.com/).
- **Questions?**: Open an issue on the [Dynamic Examples Repository](https://github.com/dynamic-labs/examples).
