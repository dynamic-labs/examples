import {
  createSmartAccountClient,
  type SmartAccountClient as PermissionlessSmartAccountClient,
} from "permissionless";
import { to7702SimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import {
  type Chain,
  type Client,
  http,
  type LocalAccount,
  type PublicClient,
  type RpcSchema,
  type SignAuthorizationReturnType,
  type Transport,
} from "viem";
import {
  entryPoint07Address,
  type SmartAccount,
} from "viem/account-abstraction";
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
  publicClient: PublicClient,
  owner: LocalAccount,
  opts?: { apiKey?: string }
): Promise<SmartAccountClient> {
  const chain = publicClient.chain!;
  const { bundlerTransport } = getPimlicoClientsForChain(chain.id, opts);
  const paymaster = createPimlicoPaymasterClient(chain.id, opts);
  const account = await to7702SimpleSmartAccount({
    client: publicClient,
    owner,
  });

  return createSmartAccountClient({
    client: publicClient,
    chain,
    account,
    paymaster,
    bundlerTransport,
  });
}

export async function getAuthorization(
  publicClient: PublicClient,
  owner: LocalAccount
): Promise<SignAuthorizationReturnType | undefined> {
  const address = owner.address;
  const code = await publicClient.getCode({ address });
  if (code) return undefined;

  if (!owner.signAuthorization) {
    throw new Error("signAuthorization is not supported");
  }

  const nonce = await publicClient.getTransactionCount({ address });
  const authorization = await owner.signAuthorization({
    address: ACCOUNT_IMPLEMENTATION_ADDRESS,
    chainId: publicClient.chain!.id,
    nonce,
  });
  return authorization;
}
