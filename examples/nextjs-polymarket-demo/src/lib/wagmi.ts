import { createConfig, http } from "wagmi";
import { polygon } from "wagmi/chains";

export const config = createConfig({
  chains: [polygon],
  connectors: [],
  transports: {
    [polygon.id]: http(),
  },
  multiInjectedProviderDiscovery: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
