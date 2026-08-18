import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { BASE_RPC_URL } from "@/lib/constants";

/** Read-only Base client. Writes go through the Dynamic wallet client. */
export const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});
