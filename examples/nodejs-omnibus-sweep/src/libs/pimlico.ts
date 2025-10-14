import {
  createSmartAccountClient,
  SmartAccountClient as PermissionlessSmartAccountClient,
} from "permissionless";
import { to7702SimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import {
  Chain,
  Client,
  http,
  RpcSchema,
  SignAuthorizationReturnType,
  Transport,
  LocalAccount,
} from "viem";
import { entryPoint07Address, SmartAccount } from "viem/account-abstraction";
import { getPublicClient } from "./viem";
import {
  ACCOUNT_IMPLEMENTATION_ADDRESS,
  PIMLICO_API_KEY,
} from "../../constants";

export type SmartAccountClient = PermissionlessSmartAccountClient<
  Transport,
  Chain,
  SmartAccount,
  Client,
  RpcSchema
>;

export interface PimlicoClients {
  bundlerTransport: ReturnType<typeof http>;
  paymasterTransport: ReturnType<typeof http>;
}

export function getPimlicoClientsForChain(
  chainId: number,
  opts?: { apiKey?: string }
): PimlicoClients {
  const apiKey = opts?.apiKey ?? PIMLICO_API_KEY;

  // Pimlico uses the same RPC endpoint for both bundling and paymaster operations
  // Check for chain-specific environment variable overrides
  const pimlicoUrl =
    process.env[`PIMLICO_BUNDLER_URL_${chainId}` as const] ||
    `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${apiKey}`;

  return {
    bundlerTransport: http(pimlicoUrl),
    paymasterTransport: http(pimlicoUrl),
  };
}

export function createPimlicoPaymasterClient(
  chainId: number,
  opts?: { apiKey?: string }
) {
  const { paymasterTransport } = getPimlicoClientsForChain(chainId, opts);

  return createPimlicoClient({
    transport: paymasterTransport,
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  });
}

export async function getSmartAccountClient(
  chain: Chain,
  owner: LocalAccount,
  opts?: { apiKey?: string }
): Promise<SmartAccountClient> {
  const { bundlerTransport } = getPimlicoClientsForChain(chain.id, opts);
  const paymaster = createPimlicoPaymasterClient(chain.id, opts);
  const client = getPublicClient({ chain });

  const account = await to7702SimpleSmartAccount({ client, owner });

  return createSmartAccountClient({
    client,
    chain,
    account,
    paymaster,
    bundlerTransport,
  });
}

export async function getAuthorization(
  chain: Chain,
  owner: LocalAccount
): Promise<SignAuthorizationReturnType | undefined> {
  const address = owner.address;
  const client = getPublicClient({ chain });
  const code = await client.getCode({ address });
  if (code) return undefined;

  if (!owner.signAuthorization) {
    throw new Error("signAuthorization is not supported");
  }

  const nonce = await client.getTransactionCount({ address });
  return await owner.signAuthorization({
    address: ACCOUNT_IMPLEMENTATION_ADDRESS,
    chainId: chain.id,
    nonce,
  });
}
