# Morpho Lite x Dynamic

This monorepo contains code for the [lite](https://lite.morpho.org) app, as well as a UIKit for components it uses. The app integrates with [Dynamic](https://dynamic.xyz) to provide seamless wallet connectivity, embedded wallets, and social login functionality.

> **Note**: This project is cloned from the original [morpho-org/morpho-lite-apps](https://github.com/morpho-org/morpho-lite-apps) repository and uses Dynamic wallet integration features.

## Installation

To get started:

```shell
git clone https://github.com/dynamic-labs/examples.git
cd examples/examples/vite-morpho-lite
# Install packages
pnpm install
# Run
pnpm run lite-app:dev
```

After running the commands above, open [http://localhost:5173/](http://localhost:5173/) in your browser to use the app.

## Features

> A lightweight frontend, designed for rapid multichain expansion

- 🦋 View your deposits in MetaMorpho vaults
- 🌌 View your borrow positions
- 📤 Withdraw from MetaMorpho vaults
- ⚡️ Repay loans, add collateral, and remove collateral
- ⛓️ Support any chain with Morpho contracts
- 👀 Explore all whitelisted vaults and markets
- 📥 Deposit or open new positions
- ✨ View Merkl rewards campaigns for lending and borrowing on Morpho
- 🏎️ Optimized for performance with Alchemy RPCs

### Dynamic Wallet Integration

- 🔐 **Embedded Wallets**: Create wallets directly in the app without external wallet installations
- 🌐 **Social Login**: Connect using Google, Twitter, Discord, and other social providers
- 🔗 **Multi-Wallet Support**: Connect multiple wallets and switch between them seamlessly
- 🛡️ **Account Abstraction**: Enhanced user experience with gasless transactions and smart account features [optional]

If you want to give your users a tailored experience across chains, the Lite App can also be whitelabeled. It only takes a few minutes to add your logo and deploy to Vercel.

### UIKit

> A package containing core components that are shared across apps

- various shadcn components with Morpho styling
- robust `useContractEvents` hook with adaptive `eth_getLogs` fetching strategies
- utility hooks like `useDebouncedMemo`, `useDeepMemo`, and `useKeyedState` (the latter being useful in avoiding state desychronization when switching chains)
- [tevm](https://www.tevm.sh/) for rapid development of type-safe lens contracts
- a `restructure` function that can be used in the "select" parameter of `useReadContracts` to recover objects rather than arrays -- quite useful, but use judiciously

## Configuration

### Dynamic Wallet Setup

To enable Dynamic wallet integration, you'll need to:

1. **Create a Dynamic Account**: Sign up at [Dynamic.xyz](https://dynamic.xyz) and create a new project
2. **Get Environment ID**: From your Dynamic dashboard, copy your Environment ID
3. **Set Environment Variable**: Create a `.env` file in the `apps/lite` directory:
   ```bash
   VITE_DYNAMIC_ENVIRONMENT_ID=your-environment-id-here
   ```
4. **Configure Wallet Connectors**: The app is pre-configured with:
   - Embedded wallets for social login
   - External wallet connectors (MetaMask, WalletConnect, etc.)
   - Account abstraction features

### Customization

The Dynamic integration can be customized in the `App.tsx` file:

- **Theme**: Set to `"dark"` or `"light"`
- **Social Providers**: Configure which social login options to show
- **Wallet Connectors**: Add or remove wallet connection options

## Architecture

The app is a single page app built with React 19, Vite, [shadcn](https://ui.shadcn.com), [wagmi](https://wagmi.sh), and [Dynamic](https://dynamic.xyz).
It uses [React Router v7](https://reactrouter.com/) (`BrowserRouter`) to enable URL-based navigation. If you're deploying
somewhere other than Vercel, take care to redirect all URL's to the route `index.html`, similar to what's done [here](apps/lite/vercel.json).

## Further Information

For more details on the app, check out its README:

- [README - Lite App](apps/lite/README.md)
