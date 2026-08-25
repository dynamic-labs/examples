import type {
  EntryPointUserOperationLog,
  Hex,
  UserOperationInclusionRequest,
  ValidationResult,
} from "./pods-types";
import {
  isAddress,
  isPlainObject,
} from "./pods-validation";

export const MONAD_RPC_URL = "https://rpc.monad.xyz";
export const USER_OPERATION_EVENT_TOPIC =
  "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f" as const;
export const MONAD_ENTRY_POINT_ADDRESSES = [
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
] as const satisfies readonly Hex[];
export const DEFAULT_INCLUSION_SEARCH_BLOCKS = BigInt(5_000);
export const MAX_LOG_RANGE_BLOCKS = BigInt(100);

const BYTES32_HEX_RE = /^0x[a-fA-F0-9]{64}$/;
const RPC_QUANTITY_HEX_RE = /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/;

function success<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function failure<T>(error: string): ValidationResult<T> {
  return { ok: false, error };
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
): string | null {
  return Object.keys(value).find((key) => !allowedKeys.has(key)) ?? null;
}

export function isUserOperationHash(value: unknown): value is Hex {
  return typeof value === "string" && BYTES32_HEX_RE.test(value);
}

export function isRpcQuantityHex(value: unknown): value is Hex {
  return typeof value === "string" && RPC_QUANTITY_HEX_RE.test(value);
}

export function validateInclusionRequest(
  input: unknown,
): ValidationResult<UserOperationInclusionRequest> {
  if (!isPlainObject(input)) return failure("request body must be an object");

  const unknownKey = hasOnlyKeys(
    input,
    new Set(["asset", "fromBlock", "sender", "userOperationHash"]),
  );
  if (unknownKey) return failure(`unknown field: ${unknownKey}`);

  if (!isUserOperationHash(input.userOperationHash)) {
    return failure("userOperationHash must be a 32-byte hex string");
  }
  if (!isAddress(input.sender)) return failure("sender must be an EVM address");
  if (input.asset !== undefined && !isAddress(input.asset)) {
    return failure("asset must be an EVM address");
  }
  if (input.fromBlock !== undefined && !isRpcQuantityHex(input.fromBlock)) {
    return failure("fromBlock must be a JSON-RPC quantity hex string");
  }

  return success({
    ...(input.asset ? { asset: input.asset } : {}),
    ...(input.fromBlock ? { fromBlock: input.fromBlock } : {}),
    sender: input.sender,
    userOperationHash: input.userOperationHash,
  });
}

export function hexToBigInt(value: Hex): bigint {
  return BigInt(value);
}

export function bigIntToHex(value: bigint): Hex {
  if (value < BigInt(0)) throw new Error("hex quantity cannot be negative");
  return `0x${value.toString(16)}` as Hex;
}

export function deriveDefaultFromBlock(latestBlock: Hex): Hex {
  const latest = hexToBigInt(latestBlock);
  if (latest < DEFAULT_INCLUSION_SEARCH_BLOCKS) return "0x0";
  return bigIntToHex(latest - DEFAULT_INCLUSION_SEARCH_BLOCKS + BigInt(1));
}

export function createLogBlockRanges(
  fromBlock: Hex,
  toBlock: Hex,
  maxBlocks = MAX_LOG_RANGE_BLOCKS,
): Array<{ fromBlock: Hex; toBlock: Hex }> {
  if (maxBlocks <= BigInt(0)) throw new Error("maxBlocks must be positive");

  const from = hexToBigInt(fromBlock);
  const to = hexToBigInt(toBlock);
  if (from > to) return [];

  const ranges: Array<{ fromBlock: Hex; toBlock: Hex }> = [];
  let start = from;
  while (start <= to) {
    const end =
      start + maxBlocks - BigInt(1) < to
        ? start + maxBlocks - BigInt(1)
        : to;
    ranges.push({
      fromBlock: bigIntToHex(start),
      toBlock: bigIntToHex(end),
    });
    start = end + BigInt(1);
  }
  return ranges;
}

export function buildBalanceOfCall(address: Hex): Hex {
  return `0x70a08231${address.slice(2).toLowerCase().padStart(64, "0")}` as Hex;
}

export function readIncludedTransactionHash(
  logs: EntryPointUserOperationLog[],
  userOperationHash: Hex,
): Hex | undefined {
  const normalizedHash = userOperationHash.toLowerCase();
  const matched = logs.find((log) =>
    log.topics.some((topic) => topic.toLowerCase() === normalizedHash),
  );
  return matched?.transactionHash;
}
