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
              environmentId:
                // replace with your own environment ID
                process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID ||
                "2762a57b-faa4-41ce-9f16-abff9300e2c9",
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
