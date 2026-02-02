/**
 * Main Application Entry Point (Server Component)
 *
 * This is a server component that renders the page shell immediately,
 * avoiding a loading spinner on initial page load.
 *
 * The Dynamic SDK requires client-side JavaScript, so the actual app
 * logic is delegated to the WalletApp client component.
 */

import { WidgetLayout } from "@/components/ui/widget-layout";
import { WalletApp } from "@/components/wallet-app";

export default function Home() {
  return (
    <WidgetLayout>
      <WalletApp />
    </WidgetLayout>
  );
}
