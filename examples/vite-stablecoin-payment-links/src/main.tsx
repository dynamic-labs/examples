import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicProvider } from "@dynamic-labs-sdk/react-hooks";
import { dynamicClient } from "./lib/dynamic";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DynamicProvider client={dynamicClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </DynamicProvider>
  </StrictMode>
);
