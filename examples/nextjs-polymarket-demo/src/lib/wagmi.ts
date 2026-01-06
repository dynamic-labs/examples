import { createConfig, http } from "wagmi";
import { mainnet, polygon } from "wagmi/chains";

export const config = createConfig({
  chains: [polygon],
  connectors: [],
  transports: {
    [polygon.id]: http(),
  },
  // Disable multi-injected provider discovery since Dynamic handles wallet detection
  multiInjectedProviderDiscovery: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
