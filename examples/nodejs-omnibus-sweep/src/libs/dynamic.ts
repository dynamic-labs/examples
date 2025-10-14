import { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import { DynamicSvmWalletClient } from "@dynamic-labs-wallet/node-svm";
import { DYNAMIC_API_TOKEN, DYNAMIC_ENVIRONMENT_ID } from "../../constants";

interface ClientProps {
  authToken?: string;
  environmentId?: string;
}

export type SupportedChain = "EVM" | "SVM";

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

  const client = new DynamicSvmWalletClient({ environmentId, authToken });
  await client.authenticateApiToken(authToken);
  return client;
};
