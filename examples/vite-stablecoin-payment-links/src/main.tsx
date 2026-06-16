import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DynamicProvider } from "@dynamic-labs-sdk/react-hooks";
import { dynamicClient } from "./lib/dynamic";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DynamicProvider client={dynamicClient}>
      <App />
    </DynamicProvider>
  </StrictMode>
);
