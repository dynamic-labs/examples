import { createConfig, http } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { arcTestnet } from "@/lib/chains";

const chains = [sepolia, baseSepolia, arcTestnet] as const;

export const config = createConfig({
  chains,
  multiInjectedProviderDiscovery: false,
  ssr: true,
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http("https://sepolia-preconf.base.org"),
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
