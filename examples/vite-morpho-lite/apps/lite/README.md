# Morpho Lite App x Dynamic

React web app for Morpho Blue and MetaMorpho contracts that's designed to work using only public RPCs－no other infrastructure required. This version integrates with [Dynamic](https://dynamic.xyz) to provide embedded wallets and social login functionality.

> **Note**: This project is cloned from the original [morpho-org/morpho-lite-apps](https://github.com/morpho-org/morpho-lite-apps) repository and uses Dynamic wallet integration features.

## Installation

To get started:

```shell
git clone https://github.com/dynamic-labs/examples.git
cd examples/examples/vite-morpho-lite
# Install packages and run
pnpm install
pnpm run lite-app:dev
```

After running the commands above, open [http://localhost:5173/](http://localhost:5173/) in your browser to use the app.

## Configuration

### Dynamic Wallet Setup

To enable Dynamic wallet integration, you'll need to:

1. **Create a Dynamic Account**: Sign up at [Dynamic.xyz](https://app.dynamic.xyz) and create a new project
2. **Get Environment ID**: From your Dynamic dashboard, copy your Environment ID
3. **Set Environment Variable**: Create a `.env` file in the root directory:
   ```bash
   VITE_DYNAMIC_ENVIRONMENT_ID=your-environment-id-here
   ```

### Smart Wallets & Account Abstraction

This example provides the foundation for Dynamic's smart wallet features. To enable advanced capabilities like gas sponsorship, transaction bundling, and session keys, see the [Dynamic Smart Wallets documentation](https://www.dynamic.xyz/docs/smart-wallets/add-smart-wallets) for setup instructions.

### App Configuration

- [constants](src/lib/constants.tsx) -- Defines general constants for the app

  - `APP_DETAILS`: Metadata to show in wallet connection modal
  - `WORDMARK`: Link to your custom branding, either externally (https://your-website.com/your-logo.svg) or locally (/your-logo.svg) to assets in the [public](public) folder. "Powered by Morpho" will appear in addition to any custom branding; this is required. Leave blank `""` for standard Morpho branding.
  - `MIN_TIMELOCK`: Vaults with timelocks _lower_ than this number of seconds will not be listed
  - `DEFAULT_CHAIN`: The chain to redirect to when the user navigates to the base url, e.g. lite.morpho.org → lite.morpho.org/polygon/earn
  - `TERMS_OF_USE`: Link to the Terms of Use to show before the user connects their wallet
  - `BANNERS`: A set of banners to show for each chain (optional) -- includes color and a React element

- [curators](src/lib/curators.ts) -- A curator whitelist to use _in addition_ to the official ones on Full Deployments. A curator is defined by a list of addresses (case-sensitive, checksummed), a name, an image, and an external website url.

To add a new chain, you'll need to update additional values in [constants](src/lib/constants.tsx), as well as the [wagmi-config](src/lib/wagmi-config.ts) and [chain icons](../packages/uikit/src/components/chain-icon.tsx).

> [!WARNING]
> Only vault `owner` addresses should be used for whitelisting. Listing or checking against other vault attributes
> (like `curator`) is dangerous as those roles can be assigned without acceptance, i.e. a scammer could assign a
> whitelisted party as their scam's curator, making it appear more legitimate than it is.

## License

Licensed under [AGPL-3.0](/apps/lite/LICENSE). If you fork, deploy, or modify the code herein (particularly for whitelabeling use-cases), please keep the "Powered by Morpho" branding in the top left of the page.
