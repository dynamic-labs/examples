#!/usr/bin/env tsx

import {
  createDelegatedEvmWalletClient,
  createZerodevClient,
} from "@dynamic-labs-wallet/node-evm";
import { zeroAddress } from "viem";

import { DYNAMIC_API_TOKEN, DYNAMIC_ENVIRONMENT_ID } from "../../constants";
import { getTransactionLink } from "../libs/utils";
import wallet from "./wallet.json";

async function sendTransaction() {
  const client = createDelegatedEvmWalletClient({
    environmentId: DYNAMIC_ENVIRONMENT_ID,
    apiKey: DYNAMIC_API_TOKEN,
  });

  console.info(`\nSending transaction...`);
  const start = Date.now();
  const zerodevClient = await createZerodevClient(client);

  const smartAccount = await zerodevClient.createKernelClientForAddress({
    withSponsorship: true,
    networkId: "11155111",
    address: wallet.address as `0x${string}`,
    delegated: {
      delegatedClient: client,
      walletId: wallet.walletId,
      walletApiKey: wallet.walletApiKey,
      keyShare: wallet.delegatedShare,
    },
  });

  const hash = await smartAccount.sendTransaction({
    to: zeroAddress,
    value: BigInt(0),
  });
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  console.info(`\n✅ Transaction sent in ${duration}s`);
  console.info(`📝 Hash: ${hash}`);
  console.info(`🔗 Explorer: ${getTransactionLink(hash)}`);

  return hash;
}

async function main() {
  try {
    await sendTransaction();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
