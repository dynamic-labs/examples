# bare-react-native-with-js-sdk-and-flow

A **bare React Native** (no Expo) example that logs a user in with Dynamic's
**email one-time-passcode** flow, provisions a Dynamic **embedded EVM wallet
as a "vault"**, and moves USDC on Base between an external wallet and the
vault in either direction using a real
[Fireblocks Flow](https://www.dynamic.xyz/docs/overview/fireblocks-flow-api):
create → attach source → quote → submit → (sign, either in the external
wallet app or silently via the embedded wallet) → display settlement status.

Deposit and Withdraw each connect an external wallet ad hoc, per operation —
MetaMask or a curated WalletConnect-catalog wallet, picked fresh every time
and never persisted or signature-verified. Both directions settle **real
USDC on Base mainnet** — no testnet fallback — capped at $5 per transfer
(`src/consts/flow.ts`'s `MAX_AMOUNT_USD`) as a guardrail against a typo
turning into an expensive mistake.

## Project structure

| Folder               | Responsible for                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/components/`    | Small, dumb presentational pieces (buttons, headers, icons) with no SDK/business logic.                             |
| `src/views/`         | Dumb, prop-driven screens composed from components — no SDK or navigation calls, just render what they're given.    |
| `src/routes/`        | The smart layer: one file per screen, owns SDK/react-query hooks and navigation, feeds a view's props.              |
| `src/utils/`         | Standalone helper functions (Flow API calls, wallet connect, small pure helpers) — one top-level function per file. |
| `src/consts/`        | Fixed config and constants (chain/token addresses, theme tokens, demo amount caps).                                 |
| `src/navigation.tsx` | The React Navigation stack + the one-time cold-boot session check that picks the initial screen.                    |
| `src/App.tsx`        | Top-level providers only (safe area, react-query, Dynamic) wrapping `<Navigation />`.                               |

## Flow & wallet connections

The files below do the actual work of talking to the Flow API and
connecting external wallets — start here to see how it's wired:

- [`src/utils/createDepositFlow.ts`](./src/utils/createDepositFlow.ts) — hand-rolled REST call creating a deposit flow: external wallet pays ETH, vault settles in USDC (Flow's create step is server-only, no client SDK function exists for it).
- [`src/utils/createWithdrawFlow.ts`](./src/utils/createWithdrawFlow.ts) — same, but for a withdrawal: vault pays USDC, destination wallet settles in native ETH.
- [`src/routes/DepositRoute.tsx`](./src/routes/DepositRoute.tsx) — create → attach → quote → submit, external wallet → vault, external wallet signs.
- [`src/routes/WithdrawAmountRoute.tsx`](./src/routes/WithdrawAmountRoute.tsx) — same sequence, vault → external wallet, the vault signs directly.
- [`src/routes/FundGasRoute.tsx`](./src/routes/FundGasRoute.tsx) — funding the vault's own withdrawal gas: balance preflight, network switch, `transferAmount`/`confirmTransaction`.
- [`src/routes/FlowStatusRoute.tsx`](./src/routes/FlowStatusRoute.tsx) — polls a flow to a terminal state and derives its step-by-step status.
- [`src/utils/connectMetaMask.ts`](./src/utils/connectMetaMask.ts) — ephemeral MetaMask connect via Dynamic's own MetaMask SDK wrapper.
- [`src/utils/connectCatalogWallet.ts`](./src/utils/connectCatalogWallet.ts) — ephemeral connect to any wallet in Dynamic's WalletConnect catalog (Trust Wallet, Rainbow, …).
- [`src/utils/getNativeBalance.ts`](./src/utils/getNativeBalance.ts) — raw ETH balance read used to gate Withdraw on the vault having enough gas.

## Prerequisites

- Node 20+
- Xcode + CocoaPods (iOS) and/or Android Studio (Android)
- pnpm (`npm i -g pnpm`) — this repo prefers pnpm, though the RN CLI itself
  defaults to npm
- A [Dynamic](https://app.dynamic.xyz) account with a **Sandbox** environment
  ID (Settings → Developers → API Keys) — never use a Live/production key
  for local development

## Requirements

- **EVM embedded wallets (WaaS) must be enabled for this environment** in
  the Dynamic dashboard, or `ProvisioningRoute.tsx`'s
  `createWaasWalletAccounts` call will fail (surfaced inline as "Embedded
  wallets aren't enabled for this Dynamic environment yet…" —
  `NoWalletProviderFoundError`/`NotWaasWalletProviderError`). This is a
  separate toggle from the Sandbox environment ID/API key setup above;
  check your project's embedded-wallet settings before running the vault
  flow end to end.
- **Email OTP must be enabled for this environment** in the Dynamic
  dashboard (Settings → Login methods) — `LoginRoute.tsx`'s
  `sendEmailOTP` call fails otherwise.

## Setup

```bash
cd examples/bare-react-native-with-js-sdk-and-flow

# 1. Install dependencies
pnpm install

# 2. Copy and fill in env vars
cp .env.example .env
# Edit .env

# 3. iOS: install native pods
cd ios && bundle install && bundle exec pod install && cd ..
```

## Running a Release build on a physical device

`pnpm ios` (step 4 above) launches a **Debug** build on the Simulator —
fine for most of the app, but neither MetaMask nor Trust Wallet can be
installed on the Simulator (see Troubleshooting), so exercising either
connect button for real means a **Release** build on an actual
iPhone/iPad, which means dealing with code signing.

`ios/BareFlowMetaMaskDemo.xcodeproj/project.pbxproj` deliberately ships
with **no `DEVELOPMENT_TEAM` set**. It's a tracked, committed file shared
by everyone who clones this example — baking in one person's or company's
Apple Developer Team ID as a "default" would leak that identifier into a
public repo's git history for no real benefit (every other clone would
just have to overwrite it with their own anyway), and it's easy to commit
by accident the moment anyone picks a team from Xcode's Signing &
Capabilities UI, since that UI writes straight into this same tracked
file. Set your team at build time instead, via the React Native CLI's
`--extra-params`, which passes through to `xcodebuild` without writing
anything to disk:

```bash
# Find your team ID (the 10-char code in the OU field of any of your valid
# signing certs):
security find-certificate -a -c "Apple Development" -p \
  | openssl x509 -noout -subject

# Find your device's UDID in the *classic* format react-native-cli expects —
# NOT the CoreDevice identifier `xcrun devicectl list devices` prints; those
# are two different ID formats for the same physical device:
xcrun xctrace list devices

# Build, sign, and install a Release build straight onto the device:
npx react-native run-ios \
  --mode Release \
  --udid <YOUR_DEVICE_UDID> \
  --extra-params "DEVELOPMENT_TEAM=<YOUR_TEAM_ID> CODE_SIGN_STYLE=Automatic"
```

> First launch with a fresh signing team/profile may prompt "Untrusted
> Developer" on the device — trust it under **Settings → General → VPN &
> Device Management** before the app will open.

> If Xcode shows a red "Failed to load container for document" error when
> you open the workspace, that's unrelated to signing — running
> `pod install` from a sandboxed/scripted shell can leave
> `project.pbxproj`/`Pods/Pods.xcodeproj/project.pbxproj` with `600`
> permissions instead of the normal `644`, which Xcode's own helper
> processes can't read. `chmod 644` both files and reopen the workspace.

If you do open the workspace in Xcode and pick a team from its Signing &
Capabilities UI instead of using `--extra-params`, check `git status`/`git
diff` in `ios/` before committing anything else — that UI writes
`DEVELOPMENT_TEAM` directly into the tracked `project.pbxproj`, and
`git checkout -- ios/BareFlowMetaMaskDemo.xcodeproj/project.pbxproj` reverts
it if you don't want it in history.

### Android

Same reasoning applies on Android: `pnpm android` runs a **Debug** build,
but MetaMask/Trust Wallet connect flows need a **Release** build on a
physical device. Unlike iOS, this needs no code-signing setup — a debug
keystore is enough to install locally — so it's just:

```bash
# Find your device's ID (the value under "List of devices attached"):
adb devices

# Build and install a Release build straight onto the device:
npx react-native run-android --device <YOUR_DEVICE_ID> --mode release
```

> Make sure USB debugging is enabled on the device (**Settings → Developer
> options → USB debugging**) and that you've accepted the "Allow USB
> debugging" prompt on the device itself, or `adb devices` will list it as
> `unauthorized` instead of showing an ID you can use.

## Environment variables

| Variable                 | Required | Description                                                                                                                  |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `DYNAMIC_ENVIRONMENT_ID` | Yes      | Your Dynamic environment ID. Use a Sandbox key.                                                                              |
| `DYNAMIC_API_BASE_URL`   | No       | Overrides the SDK's API base URL. Leave empty to use the SDK's built-in production default.                                  |
| `DYNAMIC_API_KEY`        | Yes      | Sandbox-only Dynamic API key (`flow.write` scope), used directly from the client for simplicity. **Never a production key.** |

Bare React Native has no Expo-style `EXPO_PUBLIC_*` build-time substitution,
so env vars are inlined into the bundle via
[`babel-plugin-transform-inline-environment-variables`](https://www.npmjs.com/package/babel-plugin-transform-inline-environment-variables)
(loaded from `.env` via `dotenv` in `babel.config.js`) — see `src/consts/config.ts`
for where they're read. Missing required variables throw at startup instead
of failing silently.

> **Heads up:** because `DYNAMIC_API_KEY` is called directly from the app,
> it's visible in plaintext in any request-inspector tooling (React Native's
> dev menu network inspector, Flipper, etc.) while the app is running in
> debug mode. Don't screen-record or screenshot that tooling while your key
> is loaded, and treat a sandbox key as "rotate if you suspect it leaked."

**No env var for WalletConnect.** Unlike MetaMask, `connectWithWalletConnectEvm()`
(used for Trust Wallet/Rainbow) needs a WalletConnect Project ID to work at
all — but it's not app-supplied. The SDK reads it from your Dynamic
project's own settings (Dashboard → project settings → WalletConnect),
fetched at runtime via the client, not from `.env`. If it's missing there,
connecting throws a clear `Please configure a project ID for WalletConnect
in dashboard` error instead of a confusing connection failure.

## Why MetaMask connection needs no Expo

Dynamic's [bare React Native setup guide](https://www.dynamic.xyz/docs/javascript/react-native/bare-react-native)
covers exactly this: a handful of manual polyfills (`react-native-get-random-values`,
a `Buffer` global, a `crypto.randomUUID` shim, and a minimal `window.location`
shim for the embedded-wallet WebView — see `polyfills.ts`) and two Babel
plugins (`@babel/plugin-transform-export-namespace-from`,
`@babel/plugin-transform-class-static-block` — the SDK ships modern syntax
the stock RN Babel preset doesn't transform on its own). None of it is
Expo-specific; this example intentionally scaffolds with the RN CLI directly
to keep that dependency surface visible instead of hidden behind Expo
tooling.

Trust Wallet/Rainbow's connection needs real RN-specific setup beyond the
above, per [Dynamic's WalletConnect integration guide](https://www.dynamic.xyz/docs/javascript/reference/wallets/walletconnect-integration#react-native):
`@walletconnect/react-native-compat` (imported as the very first line of
`polyfills.ts`, before even the random-values shim — it provides
crypto/encoding support Hermes lacks that WalletConnect needs unconditionally
at startup) and `@react-native-community/netinfo` (a peer dependency, so
WalletConnect sessions reconnect reliably after a network change). Android
also needs a JitPack Maven repository for one of the compat shim's native
dependencies (`android/settings.gradle`'s `dependencyResolutionManagement`
block). Without the compat shim, `addWalletConnectEvmExtension` crashes on
every app launch with `Cannot read property 'prototype' of undefined`.

`addWalletConnectEvmExtension(dynamicClient)` (`dynamicClient.ts`) is called
once at startup, mirroring `addEvmExtension`, primarily so an
already-paired WalletConnect session survives an app relaunch.
`src/utils/connectCatalogWallet.ts` resolves a WalletConnect catalog
wallet's deep link, falling back to the raw pairing URI if the catalog
lookup ever fails.

## Troubleshooting

- **`pod install` fails with `cannot load such file -- kconv` (from CFPropertyList) or a `tsort` load error (from molinillo), or a spurious `pathname contains null byte` CocoaPods crash.** Ruby 3.4+ dropped `kconv` and `tsort` from the standard library; CocoaPods' own dependencies (`CFPropertyList`, `molinillo`) still call into them. Already worked around in the `Gemfile` (`gem 'nkf'`, `gem 'tsort'`); if you still hit this, run `bundle install` again and confirm your Ruby version isn't newer than what's been tested here.
- **iOS build fails inside `hermes-engine` with `make: \*** No rule to make target 'libhermes'`, or crashes on a physical Release build with `EXC_BAD_ACCESS`/`SIGSEGV`inside Hermes's debugger/inspector setup.** This project's`ios/Podfile` forces Hermes to build from source for everyone (`ENV['RCT_BUILD_HERMES_FROM_SOURCE'] ||= 'true'`) to avoid a C++ ABI mismatch between React Native's prebuilt Hermes binary and a newer Xcode. If you still hit a Hermes build failure, check GitHub connectivity — building from source clones Hermes from `https://github.com/facebook/hermes.git`.
- **A truly from-scratch `pnpm install` + `pod install` causes a native module to fail compiling with `no type or protocol named 'Native<Something>Spec'`.** An upstream `@react-native/codegen` bug: its file-discovery uses `fs.lstatSync`, which doesn't follow symlinks, and every pnpm-managed `node_modules/<pkg>` entry is a symlink — Codegen silently skips scanning pnpm-linked packages. Patched via `pnpm patch` (`patches/@react-native__codegen@0.81.4.patch`); applies automatically on `pnpm install`. If you bump `react-native`/`@react-native/codegen`, see the patch file's own header for how to regenerate it.
- **iOS build fails with `call to consteval function ... is not a constant expression` in `fmt`.** Already worked around in `ios/Podfile`'s `post_install` for Xcode 26+; if you still see it, delete `ios/Pods` and re-run `pod install`.
- **`pod install` fails with an `Invalid \`Podfile\``error wrapping a Codegen error about`setToolbarMenuElementOptions`.** `react-native-screens` is intentionally pinned below 4.25.0 (currently `4.24.0`) in `package.json` — 4.25.0+ ships an experimental Android-only native component whose codegen this pinned React Native version (0.81.4) can't parse. This app doesn't use that experimental API, so pinning loses nothing.
- **Metro fails to resolve `stream` from inside `ws`, or a Babel error like `Export namespace should be first transformed by...`.** Delete Metro's cache (`npx react-native start --reset-cache`) and confirm `metro.config.js`'s `resolver.resolveRequest` override and both `@babel/plugin-transform-*` plugins in `babel.config.js` are present.
- **Tapping "MetaMask" on the Connect Wallet screen (`ConnectWalletRoute.tsx`) shows a red screen: `Requiring unknown module "<some number>"`.** A currently-unresolved Metro dev-server issue deep in `@metamask/mobile-wallet-protocol-dapp-client`'s dependency chain — reproduces even after a full cache reset. Doesn't affect the app otherwise; a production/release bundle may not be affected (untested here). Needs a physical device with MetaMask installed either way (MetaMask can't be installed on the iOS Simulator).
- **Tapping "Connect with Trust Wallet"/"Rainbow" shows `Unable to open URL: ...`.** Expected on the iOS Simulator (or any device without the wallet app installed) — the deep-link resolution itself worked, `Linking.openURL` just has nothing installed to hand it to. Needs a physical device with the wallet installed to test past this point.
- **A withdrawal fails with an error mentioning balance, gas, or an insufficient-funds message.** The connected wallet needs enough native ETH on **Base mainnet** to cover both the withdrawal amount and gas — `submitFlowTransaction` checks this before submitting and surfaces a clear error rather than partially submitting.
- **Known limitation: no flow persistence.** `FlowStatusRoute.tsx`'s active `flowId` lives in plain React Navigation route params — there is no AsyncStorage record and no on-launch resume. If the app is killed while a deposit/withdraw is mid-flight, relaunching it loses track of that flow entirely — the underlying Flow keeps executing server-side regardless.
- **Known limitation: an app process killed mid wallet-approval loses the in-progress Deposit/Withdraw step.** The connected external wallet for that operation is held in-memory only, never persisted by design. Relaunching returns to Home; the operation must be restarted from scratch.

## Learn more

- [Dynamic JS SDK overview](https://www.dynamic.xyz/docs/javascript/overview)
- [React Native quickstart](https://www.dynamic.xyz/docs/javascript/reference/react-native-quickstart)
- [Bare React Native setup](https://www.dynamic.xyz/docs/javascript/react-native/bare-react-native)
- [Fireblocks Flow API](https://www.dynamic.xyz/docs/overview/fireblocks-flow-api)
- [Flow getting started (JS)](https://www.dynamic.xyz/docs/javascript/reference/flow-getting-started)
