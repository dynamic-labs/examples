import {
  isAddress as isViemAddress,
  isHex as isViemHex,
} from "viem";
import type { Hex, PodsBytecodeCall, ValidationResult } from "./pods-types";

const HEX_BYTE_RE = /^0x(?:[a-fA-F0-9]{2})*$/;

export const SUPPORTED_CHAIN_IDS = new Set([143]);
export const MAX_AMOUNT_LENGTH = 78;

export function isAddress(value: unknown): value is Hex {
  return (
    typeof value === "string" &&
    isViemAddress(value, { strict: false })
  );
}

export function isHex(value: unknown): value is Hex {
  return (
    typeof value === "string" &&
    isViemHex(value) &&
    HEX_BYTE_RE.test(value)
  );
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPositiveRawAmount(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9]+$/.test(value) &&
    value !== "0" &&
    value.length <= MAX_AMOUNT_LENGTH
  );
}

function success<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function failure<T>(error: string): ValidationResult<T> {
  return { ok: false, error };
}

export function validateBytecodeCall(
  value: unknown,
  index: number,
): ValidationResult<PodsBytecodeCall> {
  if (!isPlainObject(value)) {
    return failure(`bytecode[${index}] must be an object`);
  }
  if (!isAddress(value.to)) {
    return failure(`bytecode[${index}].to must be an EVM address`);
  }
  if (!isHex(value.data)) {
    return failure(`bytecode[${index}].data must be 0x-prefixed hex bytes`);
  }
  if (typeof value.value !== "string") {
    return failure(`bytecode[${index}].value must be a string`);
  }
  try {
    if (BigInt(value.value) < BigInt(0)) {
      return failure(`bytecode[${index}].value must not be negative`);
    }
  } catch {
    return failure(`bytecode[${index}].value must be a decimal or 0x-hex integer string`);
  }
  return success({
    to: value.to,
    data: value.data,
    value: value.value,
  });
}
