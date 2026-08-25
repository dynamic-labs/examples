import {
  jsonEnvelopeResponse,
  methodNotAllowed,
  proxyAccessStatus,
} from "../../pods/route-helpers";
import {
  MONAD_ENTRY_POINT_ADDRESSES,
  MONAD_RPC_URL,
  USER_OPERATION_EVENT_TOPIC,
  buildBalanceOfCall,
  createLogBlockRanges,
  deriveDefaultFromBlock,
  hexToBigInt,
  isRpcQuantityHex,
  isUserOperationHash,
  readIncludedTransactionHash,
  validateInclusionRequest,
} from "@/lib/monad-inclusion";
import {
  proxyError,
  redactForClient,
  validateProxyAccess,
  validateScopedProxyAccess,
  validationError,
} from "@/lib/pods-client";
import {
  isAddress,
  isPlainObject,
} from "@/lib/pods-validation";
import type {
  ApiEnvelope,
  EntryPointUserOperationLog,
  Hex,
  UserOperationInclusionResponse,
  UserOperationSenderState,
} from "@/lib/pods-types";

interface RpcError {
  code?: number;
  data?: unknown;
  message: string;
}

interface RpcResponse<T> {
  error?: RpcError;
  id?: number;
  jsonrpc?: string;
  result?: T;
}

const MONAD_RPC_TIMEOUT_MS = 15_000;

function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.().slice(0, 8) ??
    Math.random().toString(16).slice(2, 10);
}

function logInfo(
  requestId: string,
  message: string,
  details: Record<string, unknown> = {},
): void {
  console.info("[monad-userop-inclusion]", message, {
    requestId,
    ...details,
  });
}

function logError(
  requestId: string,
  message: string,
  details: Record<string, unknown> = {},
): void {
  console.error("[monad-userop-inclusion]", message, {
    requestId,
    ...details,
  });
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createMonadRpcSignal(): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined" || !("timeout" in AbortSignal)) {
    return undefined;
  }
  return AbortSignal.timeout(MONAD_RPC_TIMEOUT_MS);
}

function validateRpcResult<T>(body: unknown): T {
  if (!isPlainObject(body)) {
    throw new Error("Monad RPC returned a non-object response");
  }

  const response = body as RpcResponse<T>;
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!("result" in response)) {
    throw new Error("Monad RPC response is missing result");
  }
  return response.result as T;
}

async function callMonadRpc<T>(
  method: string,
  params: unknown[],
): Promise<T> {
  const response = await fetch(MONAD_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
    cache: "no-store",
    signal: createMonadRpcSignal(),
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Monad RPC ${method} failed with HTTP ${response.status}`,
    );
  }

  return validateRpcResult<T>(body);
}

function normalizeLog(log: unknown): EntryPointUserOperationLog | null {
  if (!isPlainObject(log)) return null;
  if (!isAddress(log.address)) return null;

  const topics = Array.isArray(log.topics)
    ? log.topics.filter(isUserOperationHash)
    : [];

  return {
    address: log.address,
    ...(isRpcQuantityHex(log.blockNumber)
      ? { blockNumber: log.blockNumber }
      : {}),
    ...(isRpcQuantityHex(log.logIndex) ? { logIndex: log.logIndex } : {}),
    topics,
    ...(isUserOperationHash(log.transactionHash)
      ? { transactionHash: log.transactionHash }
      : {}),
  };
}

async function readEntryPointLogs(
  userOperationHash: Hex,
  fromBlock: Hex,
  toBlock: Hex,
): Promise<EntryPointUserOperationLog[]> {
  const ranges = createLogBlockRanges(fromBlock, toBlock);
  const results: EntryPointUserOperationLog[] = [];

  for (const range of ranges) {
    const logs = await callMonadRpc<unknown[]>("eth_getLogs", [
      {
        address: MONAD_ENTRY_POINT_ADDRESSES,
        fromBlock: range.fromBlock,
        toBlock: range.toBlock,
        topics: [USER_OPERATION_EVENT_TOPIC, userOperationHash],
      },
    ]);
    results.push(
      ...logs.flatMap((log) => {
        const normalized = normalizeLog(log);
        return normalized ? [normalized] : [];
      }),
    );
  }

  return results;
}

async function readSenderState(
  sender: Hex,
  asset?: Hex,
): Promise<UserOperationSenderState> {
  const [balance, transactionCount, code, assetBalance] = await Promise.all([
    callMonadRpc<string>("eth_getBalance", [sender, "latest"]),
    callMonadRpc<string>("eth_getTransactionCount", [sender, "latest"]),
    callMonadRpc<Hex>("eth_getCode", [sender, "latest"]),
    asset
      ? callMonadRpc<string>("eth_call", [
          {
            data: buildBalanceOfCall(sender),
            to: asset,
          },
          "latest",
        ])
      : Promise.resolve(undefined),
  ]);

  return {
    ...(assetBalance === undefined ? {} : { assetBalance }),
    balance,
    code,
    transactionCount,
  };
}

async function checkInclusion(
  userOperationHash: Hex,
  sender: Hex,
  asset?: Hex,
  requestedFromBlock?: Hex,
): Promise<UserOperationInclusionResponse> {
  const latestBlock = await callMonadRpc<Hex>("eth_blockNumber", []);
  const fromBlock = requestedFromBlock ?? deriveDefaultFromBlock(latestBlock);
  const searchIsEmpty = hexToBigInt(fromBlock) > hexToBigInt(latestBlock);
  const [entryPointLogs, senderState] = await Promise.all([
    searchIsEmpty
      ? Promise.resolve([])
      : readEntryPointLogs(userOperationHash, fromBlock, latestBlock),
    readSenderState(sender, asset),
  ]);
  const transactionHash =
    readIncludedTransactionHash(entryPointLogs, userOperationHash);
  const searchedBlocks = searchIsEmpty
    ? 0
    : Number(
        hexToBigInt(latestBlock) - hexToBigInt(fromBlock) + BigInt(1),
      );

  return {
    entryPointLogs,
    fromBlock,
    included: entryPointLogs.length > 0,
    latestBlock,
    searchedBlocks,
    searchedEntryPoints: [...MONAD_ENTRY_POINT_ADDRESSES],
    senderState,
    toBlock: latestBlock,
    ...(transactionHash ? { transactionHash } : {}),
    userOperationHash,
  };
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const startedAt = Date.now();
  logInfo(requestId, "received local Monad userOp inclusion request");

  const access = validateProxyAccess(request.headers);
  if (!access.ok) {
    logError(requestId, "proxy access rejected", {
      reason: access.error,
      durationMs: Date.now() - startedAt,
    });
    return jsonEnvelopeResponse(
      validationError(access.error),
      proxyAccessStatus(access.error),
    );
  }

  const body = await request.json().catch(() => null);
  const validated = validateInclusionRequest(body);
  if (!validated.ok) {
    logError(requestId, "request validation failed", {
      reason: validated.error,
      durationMs: Date.now() - startedAt,
    });
    return jsonEnvelopeResponse(validationError(validated.error));
  }

  const scopedAccess = validateScopedProxyAccess("wallet", validated.value.sender);
  if (!scopedAccess.ok) {
    logError(requestId, "sender scoped proxy access rejected", {
      reason: scopedAccess.error,
      sender: validated.value.sender,
      durationMs: Date.now() - startedAt,
    });
    return jsonEnvelopeResponse(
      validationError(scopedAccess.error),
      proxyAccessStatus(scopedAccess.error),
    );
  }

  logInfo(requestId, "checking Monad EntryPoint inclusion", {
    fromBlock: validated.value.fromBlock,
    sender: validated.value.sender,
    userOperationHash: validated.value.userOperationHash,
  });

  let envelope: ApiEnvelope<UserOperationInclusionResponse>;
  try {
    envelope = {
      ok: true,
      data: await checkInclusion(
        validated.value.userOperationHash,
        validated.value.sender,
        validated.value.asset,
        validated.value.fromBlock,
      ),
    };
  } catch (error) {
    logError(requestId, "Monad inclusion check failed", {
      error: readErrorMessage(error),
      durationMs: Date.now() - startedAt,
    });
    envelope = proxyError(
      "submitted",
      "Network error while checking Monad user operation inclusion.",
      502,
      redactForClient({
        message: readErrorMessage(error),
        requestId,
      }),
    );
  }

  if (envelope.ok) {
    logInfo(requestId, "Monad inclusion check completed", {
      included: envelope.data.included,
      searchedBlocks: envelope.data.searchedBlocks,
      transactionHash: envelope.data.transactionHash,
      durationMs: Date.now() - startedAt,
    });
  }

  return jsonEnvelopeResponse(envelope);
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
