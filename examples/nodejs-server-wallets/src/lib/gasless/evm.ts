/**
 * Dynamic Native Gas Sponsorship (EVM)
 *
 * Dynamic sponsors gas itself — no ERC-4337 bundler, paymaster, or smart
 * account wrapper. A sponsored transaction is a batch of `{ target, data, value }`
 * calls that the wallet authorizes with an EIP-712 intent, which Dynamic's
 * relayer then submits on-chain:
 *
 *   1. The wallet's EOA is delegated (once) to Dynamic's Universal Gasless
 *      Delegate contract via an EIP-7702 authorization.
 *   2. The wallet signs an `AuthorizedExecutions` intent binding the calls to a
 *      specific relayer and a deadline.
 *   3. Dynamic's relayer broadcasts it and reports
 *      pending -> submitted -> success/failure.
 *
 * Because the wallet keeps its own address, sponsored and unsponsored
 * transactions come from the same account — unlike a smart-account approach.
 *
 * ## Two signing paths
 *
 * **Server wallets** (`sendSponsoredTransaction`) use the SDK's built-in
 * support: you hold the wallet's key shares, so `evmClient` signs the intent
 * directly.
 *
 * **Delegated wallets** (`sendDelegatedSponsoredTransaction`) need the intent
 * assembled by hand. The SDK's `signSponsoredTransaction` signs with
 * caller-held key shares, which a delegated wallet by definition does not have —
 * its share lives with Dynamic behind a wallet-scoped API key. So we build the
 * same EIP-712 intent from the SDK's exported primitives, sign it with the
 * delegated signing functions, then hand the finished payload to
 * `sendSponsoredTransaction({ signedTransaction })`. That relay step only needs
 * your environment API token, not wallet key material — the same
 * "sign in one process, relay from another" split the SDK supports natively.
 *
 * ## Requirements
 *
 * - EVM Gas Sponsorship is an enterprise feature; enable it under
 *   Settings -> Embedded Wallets in the Dynamic dashboard.
 * - Only V3 MPC embedded wallets are supported (not imported private keys).
 * - The chain must have a Dynamic relayer. Base Sepolia (84532) and Ethereum
 *   Sepolia (11155111) are the supported testnets.
 */

import { randomBytes } from "node:crypto";

import type { ServerKeyShare, WalletMetadata } from "@dynamic-labs-wallet/node";
import {
  AUTHORIZED_EXECUTIONS_TYPES,
  BATCH_CALL_OPDATA_AUTH_MODE,
  DEFAULT_VALID_FOR_SECONDS,
  DELEGATION_CONTRACT_ADDRESS,
  type DelegatedEvmWalletClient,
  delegatedSignAuthorization,
  delegatedSignTypedData,
  type DynamicEvmWalletClient,
  type SerializedAuthorization,
  type SignedSponsoredTransaction,
  type SponsoredTransactionCall,
  UGD_ABI,
} from "@dynamic-labs-wallet/node-evm";
import { keccak256, toHex } from "viem";
import type { Chain, Hex, PublicClient, TypedData } from "viem";

import { DEFAULT_CHAIN, RPC_URL } from "../../../constants";
import type { DelegatedCredentialsBase } from "../delegated-credentials";

/** Credentials a user grants when delegating their wallet to your app. */
export interface DelegatedCredentials extends DelegatedCredentialsBase {
  /** The delegated wallet's address — this is the account that transacts. */
  address: Hex;
}

interface ChainOptions {
  /** Chain to transact on. Must have a Dynamic relayer. */
  chain?: Chain;
  /** Read-only RPC used for delegation status, EOA nonces, and nonce checks. */
  rpcUrl?: string;
}

/** Parameters for sponsoring from a server wallet you hold key shares for. */
export interface SendSponsoredTransactionOptions extends ChainOptions {
  evmClient: DynamicEvmWalletClient;
  walletMetadata: WalletMetadata;
  /** Omit when the shares are backed up to Dynamic and recovered by password. */
  externalServerKeyShares?: ServerKeyShare[];
  calls: SponsoredTransactionCall[];
  password?: string;
  /** Relay on behalf of an end user instead of the API token's service user. */
  userId?: string;
  /**
   * Single-use bitmap nonce for the intent.
   *
   * **Omit this and every call gets a fresh random nonce** — so two calls
   * describing the same logical operation are two distinct intents, and *both*
   * can land on-chain. Pass a stable value derived from your own idempotency key
   * (see `deriveIdempotencyNonce`) to make retries safe.
   */
  nonce?: bigint;
}

/** Parameters for sponsoring from a wallet a user delegated to you. */
export interface SendDelegatedSponsoredTransactionOptions extends ChainOptions {
  /** API-token client, used to look up the relayer and to relay the intent. */
  evmClient: DynamicEvmWalletClient;
  /** Delegated client, used to sign with the user's delegated share. */
  delegatedClient: DelegatedEvmWalletClient;
  credentials: DelegatedCredentials;
  calls: SponsoredTransactionCall[];
  /** How long the signed intent stays valid. Defaults to 10 minutes. */
  validForSeconds?: number;
  userId?: string;
  /**
   * Single-use bitmap nonce. Omit and a fresh random one is generated per call,
   * which makes retries unsafe. See `deriveIdempotencyNonce`.
   */
  nonce?: bigint;
}

/**
 * Send a gasless transaction from a server wallet you hold key shares for.
 *
 * The SDK signs the intent, resolves the one-time EIP-7702 delegation, relays
 * it, and polls until it lands on-chain.
 */
export async function sendSponsoredTransaction({
  evmClient,
  walletMetadata,
  externalServerKeyShares,
  calls,
  password,
  userId,
  nonce,
  chain = DEFAULT_CHAIN,
  rpcUrl = RPC_URL,
}: SendSponsoredTransactionOptions): Promise<{ transactionHash: Hex }> {
  return evmClient.sendSponsoredTransaction({
    walletMetadata,
    // Pass shares only when we hold them. When they're backed up to Dynamic,
    // omitting them lets the SDK recover them using the password.
    ...(externalServerKeyShares?.length ? { externalServerKeyShares } : {}),
    calls,
    chainId: chain.id,
    // rpcUrl lets the SDK check delegation state and auto-sign the EIP-7702
    // authorization on the wallet's first sponsored transaction.
    rpcUrl,
    ...(password && { password }),
    ...(userId && { userId }),
    ...(nonce !== undefined && { nonce }),
  });
}


/**
 * Send a gasless transaction from a delegated wallet.
 *
 * Signs the sponsorship intent with the user's delegated share, then relays it
 * with your environment API token.
 */
export async function sendDelegatedSponsoredTransaction({
  userId,
  ...options
}: SendDelegatedSponsoredTransactionOptions): Promise<{
  transactionHash: Hex;
}> {
  const signedTransaction = await signDelegatedSponsoredTransaction(options);

  return options.evmClient.sendSponsoredTransaction({
    signedTransaction,
    ...(userId && { userId }),
  });
}

/**
 * Build and sign a sponsorship intent for a delegated wallet without relaying it.
 *
 * The result is a plain JSON-serializable payload, so you can sign in one process
 * and relay from another — or hold it and relay later, within `validForSeconds`.
 *
 * This is the **only** way to split signing from relaying for a delegated wallet:
 * the SDK's own `signSponsoredTransaction` requires caller-held key shares, which
 * a delegated wallet by definition does not have. Use
 * `sendDelegatedSponsoredTransaction` above for the one-shot path; see
 * `src/evm/delegated/send-transaction.ts --pre-sign` for the split.
 *
 * The returned field set matches the SDK's `signSponsoredTransaction` output
 * exactly — same eight keys, with `deadline` and `nonce` serialized as decimal
 * strings rather than bigints — so `sendSponsoredTransaction({ signedTransaction })`
 * accepts either interchangeably.
 */
export async function signDelegatedSponsoredTransaction({
  evmClient,
  delegatedClient,
  credentials,
  calls,
  nonce: providedNonce,
  validForSeconds = DEFAULT_VALID_FOR_SECONDS,
  chain = DEFAULT_CHAIN,
  rpcUrl = RPC_URL,
}: Omit<
  SendDelegatedSponsoredTransactionOptions,
  "userId"
>): Promise<SignedSponsoredTransaction> {
  const chainId = chain.id;
  const publicClient = evmClient.createViemPublicClient({ chain, rpcUrl });

  // The relayer address is signed into the intent, so it must be resolved
  // before signing — the relay will reject an intent naming a different one.
  const [{ relayerAddress }, authorization, resolvedNonce] = await Promise.all([
    evmClient.getAvailableEvmGaslessRelayer({ chainId }),
    resolveDelegatedAuthorization({
      evmClient,
      delegatedClient,
      credentials,
      chainId,
      rpcUrl,
      publicClient,
    }),
    // A caller-supplied nonce is used as-is; otherwise generate a random one.
    providedNonce !== undefined
      ? Promise.resolve(providedNonce)
      : generateIntentNonce(publicClient, credentials.address),
  ]);
  const nonce = resolvedNonce;

  const deadline = BigInt(Math.floor(Date.now() / 1000) + validForSeconds);

  const signature = await delegatedSignTypedData(delegatedClient, {
    walletId: credentials.walletId,
    walletApiKey: credentials.walletApiKey,
    keyShare: credentials.keyShare,
    ...(credentials.shareSetId && { shareSetId: credentials.shareSetId }),
    // The SDK types this parameter as `TypedData` (the types map alone), but it
    // hashes the full EIP-712 payload with viem's `hashTypedData`. Cast so we
    // can pass the whole intent, exactly as the server-wallet path does.
    typedData: {
      domain: { chainId, verifyingContract: DELEGATION_CONTRACT_ADDRESS },
      message: {
        calls: calls.map(({ data, target, value }) => ({ data, target, value })),
        deadline,
        mode: BATCH_CALL_OPDATA_AUTH_MODE,
        nonce,
        relayer: relayerAddress,
      },
      primaryType: "AuthorizedExecutions",
      types: AUTHORIZED_EXECUTIONS_TYPES,
    } as unknown as TypedData,
  });

  return {
    ...(authorization && { authorization }),
    calls,
    chainId,
    deadline: String(deadline),
    nonce: String(nonce),
    relayer: relayerAddress as Hex,
    signature: signature as Hex,
    walletAddress: credentials.address,
  };
}

/**
 * Sign the one-time EIP-7702 authorization that delegates the wallet's EOA to
 * Dynamic's gasless delegate contract.
 *
 * Returns `undefined` when the delegation is already active on-chain — it
 * persists, so it only needs signing once per wallet per chain.
 */
async function resolveDelegatedAuthorization({
  evmClient,
  delegatedClient,
  credentials,
  chainId,
  rpcUrl,
  publicClient,
}: {
  evmClient: DynamicEvmWalletClient;
  delegatedClient: DelegatedEvmWalletClient;
  credentials: DelegatedCredentials;
  chainId: number;
  rpcUrl: string;
  publicClient: PublicClient;
}): Promise<SerializedAuthorization | undefined> {
  const isDelegated = await evmClient.is7702DelegationActive({
    walletAddress: credentials.address,
    chainId,
    rpcUrl,
  });
  if (isDelegated) return undefined;

  // An EIP-7702 authorization commits to the EOA's own transaction nonce.
  const nonce = Number(
    await publicClient.getTransactionCount({ address: credentials.address }),
  );

  const signature = await delegatedSignAuthorization(delegatedClient, {
    walletId: credentials.walletId,
    walletApiKey: credentials.walletApiKey,
    keyShare: credentials.keyShare,
    ...(credentials.shareSetId && { shareSetId: credentials.shareSetId }),
    authorization: {
      address: DELEGATION_CONTRACT_ADDRESS,
      chainId,
      nonce,
    },
  });

  if (signature.yParity === undefined) {
    throw new Error("Signed EIP-7702 authorization is missing yParity");
  }

  return {
    address: DELEGATION_CONTRACT_ADDRESS,
    chainId,
    nonce,
    r: signature.r,
    s: signature.s,
    yParity: signature.yParity,
  };
}

/**
 * Derive a stable 256-bit intent nonce from an application-level idempotency key.
 *
 * The delegate contract tracks spent nonces in a bitmap, so a nonce is consumable
 * exactly once per wallet. Deriving it from something like an order ID means every
 * retry of that logical operation produces the *same* nonce, and at most one
 * attempt can ever land.
 *
 * Stronger than persisting a signed intent and replaying it, because it survives
 * re-signing — which matters since intents expire (10 minutes by default), so a
 * long retry window forces a re-sign, and a re-sign without a fixed nonce silently
 * loses the guarantee.
 *
 * keccak256 gives a uniformly distributed 256-bit value, exactly the nonce width.
 *
 * EVM-only: SVM has no nonce, and there the signed bytes are the idempotency unit.
 * See IDEMPOTENCY.md.
 *
 * @param key - Stable identifier for the operation, e.g. `order:12345`. Unique per
 *              intended execution, identical across retries.
 */
export function deriveIdempotencyNonce(key: string): bigint {
  return BigInt(keccak256(toHex(key)));
}

/**
 * Generate a single-use bitmap nonce for the intent.
 *
 * The delegate contract tracks spent nonces in a bitmap rather than a counter,
 * so intents don't have to land in order. A 256-bit random value makes
 * collisions negligible; the on-chain check is a cheap extra guard.
 */
async function generateIntentNonce(
  publicClient: PublicClient,
  walletAddress: Hex,
): Promise<bigint> {
  const randomNonce = () => BigInt(`0x${randomBytes(32).toString("hex")}`);
  const nonce = randomNonce();

  try {
    const isUsed = await publicClient.readContract({
      address: walletAddress,
      abi: UGD_ABI,
      functionName: "isNonceUsed",
      args: [nonce],
    });
    if (isUsed) return randomNonce();
  } catch {
    // A wallet that isn't delegated yet has no delegate code, so this call
    // reverts. Harmless — the random value is safe either way.
  }

  return nonce;
}
