import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

// Create wagmi config focused on Base Sepolia
export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});
