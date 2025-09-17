import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";

import App from "./App";
import "./index.css";

const NETWORK_OVERRIDES = [
  {
    blockExplorerUrls: ['https://sepolia.basescan.org/'],
    chainId: 84532,
    chainName: 'Base Sepolia',
    iconUrls: [
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
    ],
    name: 'Base Sepolia Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
      iconUrl:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
    },
    networkId: 84532,
    rpcUrls: ['https://sepolia.base.org'],
    vanityName: 'Base Sepolia Testnet',
  },
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: NETWORK_OVERRIDES,
        },
      }}
    >
      <App />
    </DynamicContextProvider>
  </StrictMode>
);