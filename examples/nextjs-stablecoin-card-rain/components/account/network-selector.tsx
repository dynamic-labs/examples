"use client";

// Network switching is not supported for embedded WaaS wallets.
// This component returns null to avoid rendering a broken UI.

export default function NetworkSelector(_props: {
  currentNetwork: { id: string; name: string; iconUrl: string | undefined };
}) {
  return null;
}
