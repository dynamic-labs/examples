"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  DynamicContextProvider,
  EthereumWalletConnectors,
  DynamicUserProfile,
  ZeroDevSmartWalletConnectors,
} from "@/lib/dynamic";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/lib/toast-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { redirect } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID;
  if (!environmentId) {
    throw new Error(
      "NEXT_PUBLIC_DYNAMIC_ENV_ID is not set. Copy .example.env to .env.local and fill it in."
    );
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <ToastProvider>
          <DynamicContextProvider
            theme="light"
            settings={{
              environmentId,
              walletConnectors: [
                EthereumWalletConnectors,
                ZeroDevSmartWalletConnectors,
              ],
              events: {
                onLogout: () => redirect("/"),
              },
            }}
          >
            <QueryClientProvider client={queryClient}>
              {children}
              <DynamicUserProfile />
            </QueryClientProvider>
          </DynamicContextProvider>
        </ToastProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
