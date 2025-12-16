import DynamicMethods from "@/components/dynamic/dynamic-methods";

/**
 * Methods Page
 *
 * Playground for testing Dynamic SDK methods like:
 * - Fetching user data
 * - Fetching wallet information
 * - Signing messages (Ethereum)
 * - Getting PublicClient/WalletClient (viem)
 */
export default function MethodsPage() {
  return (
    <div className="min-h-svh w-full bg-muted">
      <div className="mx-auto max-w-6xl w-full pt-12 px-4">
        <DynamicMethods />
      </div>
    </div>
  );
}
