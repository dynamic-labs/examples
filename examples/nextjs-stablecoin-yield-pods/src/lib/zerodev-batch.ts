import type { BatchCall, Hex, PodsBytecodeCall } from "./pods-types";

export function bytecodeToBatchCalls(bytecode: PodsBytecodeCall[]): BatchCall[] {
  if (bytecode.length === 0) {
    throw new Error("Pods returned no bytecode calls to batch");
  }

  return bytecode.map((call, index) => ({
    to: call.to,
    data: call.data,
    value: parseCallValue(call.value, index),
  }));
}

function parseCallValue(value: string, index: number): bigint {
  let parsed: bigint;
  try {
    parsed = BigInt(value);
  } catch {
    throw new Error(`bytecode[${index}].value is not a valid integer`);
  }

  if (parsed < BigInt(0)) {
    throw new Error(`bytecode[${index}].value must not be negative`);
  }

  return parsed;
}

export function readTransactionHash(receipt: unknown): Hex | undefined {
  if (typeof receipt !== "object" || receipt === null) return undefined;
  const root = receipt as Record<string, unknown>;
  if (isHex(root.transactionHash)) return root.transactionHash;
  const nested = root.receipt;
  if (typeof nested !== "object" || nested === null) return undefined;
  const nestedRecord = nested as Record<string, unknown>;
  return isHex(nestedRecord.transactionHash)
    ? nestedRecord.transactionHash
    : undefined;
}

function isHex(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[a-fA-F0-9]+$/.test(value);
}
