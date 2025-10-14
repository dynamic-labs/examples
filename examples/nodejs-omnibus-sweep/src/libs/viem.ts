import {
  Chain,
  type Hex,
  type LocalAccount,
  createPublicClient,
  http,
} from "viem";
import { type DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";

interface GetPublicClientParams {
  chain: Chain;
  rpcUrl?: string;
}

interface CreateWalletAccountParams {
  dynamicEvmClient: DynamicEvmWalletClient;
  address: string;
  externalServerKeyShares?: Awaited<
    ReturnType<DynamicEvmWalletClient["createWalletAccount"]>
  >["externalServerKeyShares"];
  chain: Chain;
}

export function getPublicClient({ chain, rpcUrl }: GetPublicClientParams) {
  return createPublicClient({
    chain,
    transport: http(rpcUrl ?? chain.rpcUrls.default.http[0]),
  });
}

// Note: This function will be added to the DynamicEvmWalletClient in the future
export function getWalletClient({
  dynamicEvmClient,
  address,
  externalServerKeyShares,
  chain,
}: CreateWalletAccountParams) {
  const account = {
    address: address as `0x${string}`,
    source: "mpc",
    type: "local",
    publicKey: "0x" as `0x${string}`, // Note: Added publicKey to satisfy the LocalAccount type
    signMessage: async ({ message }: { message: any }) => {
      const signature = await dynamicEvmClient.signMessage({
        accountAddress: address,
        externalServerKeyShares,
        message,
      });
      return signature as Hex;
    },
    signTypedData: async (parameters: any) => {
      return (await dynamicEvmClient.signTypedData({
        accountAddress: address,
        externalServerKeyShares,
        typedData: parameters,
      })) as Hex;
    },
    signTransaction: async (transaction: any) => {
      return (await dynamicEvmClient.signTransaction({
        senderAddress: address,
        externalServerKeyShares,
        transaction,
      })) as Hex;
    },
    signAuthorization: async (parameters: any) => {
      const signature = await dynamicEvmClient.signAuthorization({
        accountAddress: address,
        externalServerKeyShares,
        authorization: parameters,
      });
      // Return the complete signed authorization (original data + signature)
      return { ...parameters, ...signature };
    },
  } satisfies LocalAccount;

  return account;
}
