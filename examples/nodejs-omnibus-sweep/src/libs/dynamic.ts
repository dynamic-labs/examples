import {
  createZerodevClient,
  DynamicEvmWalletClient,
} from "@dynamic-labs-wallet/node-evm";
import type { KernelClient } from "@dynamic-labs-wallet/node-evm/src/zerodev/types";
import { DynamicSvmWalletClient } from "@dynamic-labs-wallet/node-svm";
import { DYNAMIC_API_TOKEN, DYNAMIC_ENVIRONMENT_ID } from "../../constants";

interface ClientProps {
  authToken?: string;
  environmentId?: string;
}

interface SmartAccountClientProps {
  evmClient: DynamicEvmWalletClient;
  networkId: string;
  address: `0x${string}`;
  externalServerKeyShares?: string[];
  password?: string;
}

export const authenticatedEvmClient = async (args?: ClientProps) => {
  const environmentId = args?.environmentId ?? DYNAMIC_ENVIRONMENT_ID;
  const authToken = args?.authToken ?? DYNAMIC_API_TOKEN;
  const client = new DynamicEvmWalletClient({ environmentId });

  await client.authenticateApiToken(authToken);
  return client;
};

export const authenticatedSvmClient = async (args?: ClientProps) => {
  const environmentId = args?.environmentId ?? DYNAMIC_ENVIRONMENT_ID;
  const authToken = args?.authToken ?? DYNAMIC_API_TOKEN;
  const client = new DynamicSvmWalletClient({ environmentId });

  await client.authenticateApiToken(authToken);
  return client;
};

export const smartAccountClient = async (
  args: SmartAccountClientProps
): Promise<KernelClient> => {
  const zerodevClient = await createZerodevClient(args.evmClient);

  return await zerodevClient.createKernelClientForAddress({
    withSponsorship: true,
    address: args.address,
    networkId: args.networkId,
    ...(args.externalServerKeyShares && {
      externalServerKeyShares: args.externalServerKeyShares,
    }),
    ...(args.password && { password: args.password }),
  });
};
