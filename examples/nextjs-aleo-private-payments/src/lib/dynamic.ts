import { createDynamicClient, initializeClient } from "@dynamic-labs-sdk/client";
import { addWaasAleoExtension } from "@dynamic-labs-sdk/aleo/waas";

// `universalLink` defaults to `window.location.origin`, which does not exist
// while Next.js renders on the server, so this module can be imported from a
// "use client" module graph without throwing.
const universalLink =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";

if (
  typeof window !== "undefined" &&
  !process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID
) {
  console.error(
    "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not set. Copy .env.example to " +
      ".env.local and fill in your environment ID from app.dynamic.xyz.",
  );
}

export const dynamicClient = createDynamicClient({
  autoInitialize: false,
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
  metadata: {
    name: "Aleo Private Payments",
    universalLink,
  },
});

// Registering the extension is what teaches the client about Aleo: it adds the
// embedded-wallet provider and the Aleo network provider used to read balances.
// `addAleoWalletStandardExtension()` from "@dynamic-labs-sdk/aleo/walletStandard"
// is the equivalent for external Aleo wallets such as Leo or Puzzle.
if (typeof window !== "undefined") {
  addWaasAleoExtension();
  initializeClient().catch((error) => {
    console.error("Dynamic client failed to initialize", error);
  });
}
