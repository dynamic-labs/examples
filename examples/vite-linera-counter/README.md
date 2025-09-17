# Linera + Dynamic Counter Demo

This project demonstrates how to integrate the Linera Web client with Dynamic wallet authentication in a Vite + React application. It showcases a complete flow from wallet connection through chain creation to application interaction.

The demo implements a simple counter application that runs on the Linera network, allowing users to connect their Dynamic wallet, create a personal chain, deploy the counter application, and interact with it through GraphQL queries and mutations.

Based on the Linera Web hosted example "hosted-counter-metamask," adapted to use Dynamic wallet authentication and Vite as the build tool.

## What this shows

- Complete wallet authentication flow using Dynamic SDK
- Linera Web JS/WASM bundle loading under COOP/COEP headers for cross-origin isolation
- Custom Signer bridge implementation that connects Dynamic wallets to Linera's signing requirements (EIP-191 `personal_sign`)
- Chain creation and application deployment on the Linera network
- GraphQL integration for querying and mutating application state
- Real-time block subscription and notification handling
- Vite configuration optimized for Linera Web integration
- Dynamic iframe shim for handling wallet connection UI under strict CORS policies

## Key pieces

- `vite.config.ts`: sets response headers required by Linera Web
  - `Cross-Origin-Embedder-Policy: credentialless`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: cross-origin`
- `index.html`: injects a small iframe shim required by Dynamic under these headers
- `public/js/dynamic-iframe-shim.js`: marks Dynamic-hosted iframes as credentialless
- `src/lib/dynamic-signer.ts`: implements Linera’s `Signer` interface using the connected Dynamic wallet (EIP-191 `personal_sign`)
- `src/lib/linera-adapter.ts`: connects to the Linera faucet, creates/claims a chain, and exposes query/mutation helpers
- `src/constants.ts`: set `LINERA_RPC_URL` and the `COUNTER_APP_ID` used by the demo
- `linera-protocol/linera-web`: consumed locally as `@linera/client` via the git submodule

## Prerequisites

- Node 18+
- pnpm (recommended)
- Optional (only if rebuilding Linera Web locally): Rust toolchain and whatever `linera-protocol/linera-web` requires

## Setup

### Clone and initialize the Linera submodule

```bash
git clone <this-repo>
cd linera-vites
git submodule init
git submodule update --remote
```

The app depends on `linera-protocol` via a git submodule at `linera-protocol/` and references `linera-web` as a local dependency.

### Provide the Dynamic environment ID

Create a `.env.local` in the project root with:

```bash
VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
```

Note: Vite only exposes variables prefixed with `VITE_` to the client.

### Install and run the app

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

To build and preview a production bundle:

```bash
pnpm build
pnpm preview
```

## How to use the demo

1. Click "Connect Wallet" to authenticate with Dynamic and connect your wallet.
2. After wallet connection, click "Connect to Linera" to create a chain and connect to the Linera network.
3. Click "Connect to App" to set the counter application on your chain.
4. Use "Get Count" to read the current counter value and "Increment Count" to increase it by 1.
5. The "Blocks" panel will update automatically when new blocks arrive on your chain.

You can update `LINERA_RPC_URL` and `COUNTER_APP_ID` in `src/constants.ts` to point at a different faucet/application.

## How the integration works (high level)

- Linera Web is consumed from the local submodule (`linera-protocol/linera-web`) via `@linera/client`.
- The Vite dev server sends COOP/COEP headers, making the page cross-origin isolated, which enables SharedArrayBuffer and worker isolation.
- Dynamic is initialized in `src/main.tsx` via `DynamicContextProvider` using `VITE_DYNAMIC_ENVIRONMENT_ID`.
- The signer bridge in `src/lib/dynamic-signer.ts` implements Linera’s `Signer` by delegating to the connected wallet (EIP-191 `personal_sign`).
- The small `dynamic-iframe-shim.js` is loaded from `index.html` before the app to mark Dynamic-hosted iframes as credentialless when COEP/COOP are enabled.

## Troubleshooting

### Build and Development Issues

- **SharedArrayBuffer or worker errors**: Ensure you're running through `pnpm dev` so the COOP/COEP headers in `vite.config.ts` are applied. These headers are required for Linera Web's cross-origin isolation.
- **@linera/client assets fail to load**: After updating the submodule, re-run `pnpm install` to refresh the local file dependency.
- **Build errors**: Make sure Node.js 18+ is installed and you're using pnpm as the package manager.

### Wallet Connection Issues

- **Dynamic login iframe blocked or not loading**: Ensure `index.html` includes `public/js/dynamic-iframe-shim.js` before your app script. The shim sets `credentialless` on Dynamic-hosted iframes (e.g., `relay.dynamicauth.com`). If using a custom Dynamic domain, update the host-matching logic in the shim. Verify in DevTools that the login iframe has `credentialless` set and no "blocked by response" errors.
- **Missing VITE_DYNAMIC_ENVIRONMENT_ID**: Create a `.env.local` file in the project root with your Dynamic environment ID.

### Linera Connection Issues

- **"Failed to connect to Linera" error**: Check that `LINERA_RPC_URL` in `src/constants.ts` is reachable: `curl -I <LINERA_RPC_URL>` should return HTTP 200. The faucet may be down or the RPC URL may be incorrect.
- **"Failed to get application" or similar errors**: After clicking "Connect to App", if you see application errors, ensure `COUNTER_APP_ID` exists on the same network as `LINERA_RPC_URL`.
- **Connection succeeds but no address/chain ID shown**: Verify the faucet is operational and the RPC URL is correct.
- **Mismatched environments**: App IDs from different networks than the faucet will prevent queries from succeeding. Cross-check official testnet values at [Linera demos testnet .env](https://demos.linera.net/testnet/.env).

### Application Interaction Issues

- **"Connect to App" button not appearing**: Ensure you've successfully connected to Linera first by checking for your address and chain ID in the results panel.
- **Counter not updating**: Make sure you've clicked "Connect to App" before trying to get or increment the count.
- **Block notifications not appearing**: Blocks only appear after successful application interactions. The subscription is established after connecting to the app.

### Performance and Optimization

- **Slow loading**: The Linera Web WASM bundle is large; first load may take time.
- **Memory usage**: Linera Web runs WASM in workers; monitor browser memory if experiencing issues.
