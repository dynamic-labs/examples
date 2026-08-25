# Dynamic Pods ZeroDev Batched Deposit

This example tests the ZeroDev path for Pods deposits:

1. Connect a Dynamic wallet through the ZeroDev smart wallet connector.
2. Pass the connected smart wallet address as the Pods `wallet` param.
3. Request `GET /strategies/:strategyId/bytecode` without `output=userOperation`.
4. Convert the returned `bytecode[]` into ZeroDev `{ to, value, data }` calls.
5. Submit the whole call array with `kernelClient.sendTransaction({ calls })`.
6. Poll ZeroDev for a user operation receipt and, if the receipt is missing,
   query Monad EntryPoint logs for the returned user operation hash.

It is a batching proof, not a full yield dashboard. A submitted user operation
hash means the ZeroDev kernel client accepted the batched call submission. It is
not the Monad transaction hash; the operation is only considered included after
ZeroDev returns a receipt with a transaction hash or Monad has an EntryPoint
`UserOperationEvent` for that hash.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Use a regular `.env.local` file in this directory. Do not symlink it from
another checkout or worktree.

```bash
NEXT_PUBLIC_DYNAMIC_ENV_ID=your-dynamic-environment-id
PODS_API_KEY=your-pods-api-key
PODS_API_URL=https://api.pods.finance
ALLOW_PUBLIC_PODS_PROXY=false
PODS_DEBUG_RAW_RESPONSE=false
NEXT_PUBLIC_ZERODEV_RPC_URL=https://rpc.zerodev.app/api/v3/<zerodev-project-id>/chain/143
```

`PODS_API_KEY` is server-only. The browser talks to local Next route handlers,
not directly to Pods with a public API key.

## Dynamic And ZeroDev

The Dynamic environment must be configured for ZeroDev smart wallets. This app
registers both `EthereumWalletConnectors` and the configured ZeroDev smart
wallet connector, then requires the connected primary wallet connector to satisfy
`isZeroDevConnector`.

Before running the example, complete the dashboard setup in this order:

1. Create a ZeroDev account.
2. In the ZeroDev platform, create a project with Monad mainnet support.
3. Add a payment method in the ZeroDev platform. Gas sponsorship requires a
   funded billing setup before user operations can be sponsored.
4. In ZeroDev, create or enable a gas-sponsoring policy for the Monad project.
   If the policy uses permitted wallet allowlists or target restrictions, keep
   those settings open because the Dynamic wallet address is only known after
   wallet creation.
5. In the Dynamic console, enable Embedded Wallets for the environment used by
   this example.
6. In the Dynamic console, open Sponsor Gas and add ZeroDev as an External
   Provider.
7. Paste the ZeroDev project id into the Dynamic ZeroDev gas sponsor settings.
8. Enable sponsorship for all users in the Dynamic gas sponsor settings.
9. Save the Dynamic dashboard changes, then refresh this app.
10. Run the app, sign in, and create the Dynamic embedded smart wallet.
11. Copy the created Dynamic smart wallet address.
12. In ZeroDev, add that wallet address to the permitted wallets list so it is
    allowed to use gas sponsorship.
13. Retry the app after the ZeroDev policy change is saved.

For the Monad fixture, the ZeroDev project configured in Dynamic Sponsor Gas
must resolve to Monad mainnet `143`. ZeroDev's current dashboard exposes a
chain-scoped Bundler/Paymaster RPC like
`https://rpc.zerodev.app/api/v3/<project-id>/chain/143`; set that URL in
`NEXT_PUBLIC_ZERODEV_RPC_URL` so the connector does not fall back to legacy
`/api/v2/bundler/:projectId` URLs.

If the batch still fails with a ZeroDev bundler error like
`ChainId not found ... for projectId`, the Pods bytecode was fetched correctly
but the ZeroDev connector is still using a project/RPC that is not mapped to the
requested chain. Create or select a ZeroDev project for Monad mainnet `143`,
paste that project id into Dynamic Dashboard > Sponsor Gas > ZeroDev, then open
Bundler and paymaster configurations and use the same v3 RPC for Monad if the
dashboard offers explicit RPC overrides. Save, refresh the app, and reconnect.

Values configured in the Dynamic dashboard can take precedence over the code
defaults supplied by this example. The operation log prints the resolved
`bundlerRpc` and `paymasterRpc` fields so you can verify which endpoint the
connector is actually using.

Before submitting, the app logs a side-effect-free batch preflight: sender,
selected ZeroDev client mode, submit method, receipt reader availability, call
count, and encoded calldata byte length. It intentionally does not call
`prepareUserOperation`, because that can trigger paymaster sponsorship before
the real submission.

If the batch reaches `zd_sponsorUserOperation` and fails with
`AA21 didn't pay prefund`, the ZeroDev RPC is now correct but sponsorship did
not attach a valid paymaster prefund during simulation. For a gasless run,
create or enable a ZeroDev gas policy for Monad mainnet `143`, make sure it has
budget or gas credits, and make sure the policy allows the batched call targets.
For an unsponsored control run, fund the sender smart wallet with native MON.

If ZeroDev returns a user operation hash but `eth_getUserOperationReceipt` keeps
returning "Failed to get user operation receipt", the app now calls the local
`/api/monad/user-operation-inclusion` route. That route queries Monad
`eth_getLogs` for EntryPoint `UserOperationEvent` in bounded chunks, then reads
the sender native balance, nonce, code, and asset balance. If no EntryPoint log
is found, the UI marks the operation as `not included` instead of treating the
hash as proof of propagation.

If the connected wallet is a plain Dynamic EOA, the app will stop before calling
Pods. The Pods bytecode must be built for the smart wallet that will execute the
batch.

## Fixture

The form starts with the Monad fixture for this batching test:

- Chain id: `143`
- Strategy id: `Morpho-hyperUSDCa-monad`
- Asset: `0x754704Bc059F8C67012fEd69BC8A327a5aafb603`
- Raw amount: `1000000`

`1000000` is 1 USDC with 6 decimals.

## Request Shape

The local route calls Pods like this:

```text
GET /strategies/Morpho-hyperUSDCa-monad/bytecode?action=lend&chainId=143&amount=1000000&asset=0x754704Bc059F8C67012fEd69BC8A327a5aafb603&wallet=<zerodev-smart-wallet>
```

There is intentionally no `output=userOperation` query param and no call to
Pods `/aa/send-user-operation` in this example.

## Safety Notes

The route handler rejects non-local production use by default. Set
`ALLOW_PUBLIC_PODS_PROXY=true` only for intentional public testing. The handler
also validates payloads, rate limits simple abuse, and redacts signatures,
paymaster data, API keys, headers, and large payloads before returning debug
details to the browser.

`PODS_DEBUG_RAW_RESPONSE=true` is only for local debugging. Do not enable it on
a public deployment.

## Verification

```bash
pnpm test
pnpm type-check
pnpm lint
pnpm build
```

Manual smoke:

1. Start the app with `pnpm dev`.
2. Connect the Dynamic ZeroDev smart wallet.
3. Keep or edit the fixture values.
4. Submit the batched deposit.
5. Verify the diagnostics show one Pods bytecode request and a single batched
   ZeroDev submission containing all returned bytecode calls.

If the app ends in `not included`, ZeroDev accepted the submission locally
enough to return a user operation hash, but the operation was not observed on
Monad EntryPoint in the searched block range. Check the operation log for
whether sponsorship was selected, then inspect the ZeroDev dashboard/bundler
logs or retry with a funded sender and valid gas policy.
