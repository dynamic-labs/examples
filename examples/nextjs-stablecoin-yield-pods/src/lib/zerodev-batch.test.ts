import { describe, expect, it } from "vitest";
import {
  bytecodeToBatchCalls,
  readTransactionHash,
} from "./zerodev-batch";
import type { PodsBytecodeCall } from "./pods-types";

const bytecode: PodsBytecodeCall[] = [
  {
    to: "0x1111111111111111111111111111111111111111",
    value: "0",
    data: "0x1234",
  },
  {
    to: "0x2222222222222222222222222222222222222222",
    value: "42",
    data: "0xabcd",
  },
];

describe("bytecodeToBatchCalls", () => {
  it("preserves order while converting values to bigint", () => {
    expect(bytecodeToBatchCalls(bytecode)).toEqual([
      {
        to: "0x1111111111111111111111111111111111111111",
        value: BigInt(0),
        data: "0x1234",
      },
      {
        to: "0x2222222222222222222222222222222222222222",
        value: BigInt(42),
        data: "0xabcd",
      },
    ]);
  });

  it("rejects empty and invalid bytecode values before sending to ZeroDev", () => {
    expect(() => bytecodeToBatchCalls([])).toThrow("no bytecode calls");
    expect(() =>
      bytecodeToBatchCalls([{ ...bytecode[0], value: "nope" }]),
    ).toThrow("not a valid integer");
    expect(() =>
      bytecodeToBatchCalls([{ ...bytecode[0], value: "-1" }]),
    ).toThrow("must not be negative");
  });
});

describe("readTransactionHash", () => {
  it("extracts transaction hashes from direct and nested receipt shapes", () => {
    const hash = `0x${"12".repeat(32)}` as const;

    expect(readTransactionHash({ transactionHash: hash })).toBe(hash);
    expect(readTransactionHash({ receipt: { transactionHash: hash } })).toBe(
      hash,
    );
    expect(readTransactionHash({ receipt: {} })).toBeUndefined();
  });
});
