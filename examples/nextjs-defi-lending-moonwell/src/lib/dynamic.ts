import { createDynamicClient, initializeClient } from "@dynamic-labs-sdk/client";
import { addEvmExtension } from "@dynamic-labs-sdk/evm";
import { BASE_RPC_URL, CHAIN_ID } from "@/lib/constants";

// `universalLink` defaults to `window.location.origin`, which does not exist
// while Next.js renders on the server — fall back to the dev origin so this
// module can be imported from a "use client" module graph without throwing.
const universalLink =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";

// Named loudly because it is the one setup step every reader must get right —
// without it the SDK fails with a message that says nothing about env vars.
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID) {
  console.error(
    "NEXT_PUBLIC_DYNAMIC_ENV_ID is not set. Copy .env.example to .env.local " +
      "and fill in your environment ID from app.dynamic.xyz.",
  );
}

export const dynamicClient = createDynamicClient({
  autoInitialize: false,
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID!,
  metadata: {
    name: "Moonwell Lending",
    universalLink,
  },
  transformers: {
    /**
     * The first network of a chain is the default for a fresh wallet, so
     * restricting the EVM list to Base makes Base the default — without this,
     * an environment that also has Ethereum enabled hands out wallets sitting
     * on chain 1 and every write fails until the user switches.
     *
     * Also puts `BASE_RPC_URL` in front of the project's own RPC list, so the
     * WaaS client broadcasts through it — Dynamic builds that transport from
     * `networkData.rpcUrls`, so overriding it here is what makes the send use
     * a working endpoint rather than Base's rate-limited public one.
     */
    networksData: (networksData) =>
      networksData
        .filter(
          (network) =>
            network.chain !== "EVM" || Number(network.networkId) === CHAIN_ID,
        )
        .map((network) => {
          if (Number(network.networkId) !== CHAIN_ID) return network;
          return {
            ...network,
            rpcUrls: {
              ...network.rpcUrls,
              http: [BASE_RPC_URL, ...network.rpcUrls.http],
            },
          };
        }),
  },
});

// Register extensions and initialize at module scope so both happen before any
// component renders. Extension functions take NO arguments. The browser guard
// is a Next.js concern only: "use client" modules still execute during SSR,
// where there is no wallet environment to initialize.
if (typeof window !== "undefined") {
  addEvmExtension();
  // The react-hooks surface reports init failure through `initStatus`; the
  // log keeps the underlying cause from being swallowed with it.
  initializeClient().catch((error) => {
    console.error("Dynamic client failed to initialize", error);
  });
}
