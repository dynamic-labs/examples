import React from "react";
import "./App.css";
import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import MPCDemo from "./components/MPCDemo";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { SuiWalletConnectors } from "@dynamic-labs/sui";

const App: React.FC = () => {
  // Get environment ID from .env file or use a placeholder
  const environmentId = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID;

  if (!environmentId) {
    throw new Error("VITE_DYNAMIC_ENVIRONMENT_ID is not set");
  }

  // Configure settings for Dynamic provider
  const settings = {
    environmentId,
    walletConnectors: [
      EthereumWalletConnectors,
      SolanaWalletConnectors,
      SuiWalletConnectors,
    ],
  };

  return (
    <div className="App">
      <div className="App-background">
        <div className="App-container">
          <header className="App-header">
            <div className="header-content">
              <h1>Dynamic TSS-MPC Demo</h1>
              <p>Demonstrates the TSS-MPC Embedded Wallets functionality</p>
            </div>
          </header>

          <DynamicContextProvider settings={settings} enableInstrumentation>
            <main className="App-main">
              <div className="widget-section">
                <DynamicWidget />
              </div>
              <div className="demo-section">
                <MPCDemo />
              </div>
            </main>
          </DynamicContextProvider>
        </div>
      </div>
    </div>
  );
};

export default App;
