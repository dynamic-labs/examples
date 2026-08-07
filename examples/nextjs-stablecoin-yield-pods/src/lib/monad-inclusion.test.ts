import { describe, expect, it } from "vitest";
import {
  DEFAULT_INCLUSION_SEARCH_BLOCKS,
  MONAD_ENTRY_POINT_ADDRESSES,
  USER_OPERATION_EVENT_TOPIC,
  buildBalanceOfCall,
  createLogBlockRanges,
  deriveDefaultFromBlock,
  readIncludedTransactionHash,
  validateInclusionRequest,
} from "./monad-inclusion";
import type { EntryPointUserOperationLog } from "./pods-types";

const sender = "0x53757D719dE5e90739939B7118815510d41eEdF2";
const asset = "0x754704Bc059F8C67012fEd69BC8A327a5aafb603";
const userOperationHash = `0x${"12".repeat(32)}` as const;
const transactionHash = `0x${"34".repeat(32)}` as const;

describe("validateInclusionRequest", () => {
  it("accepts the fields needed for a Monad user operation lookup", () => {
    expect(
      validateInclusionRequest({
        asset,
        fromBlock: "0x10",
        sender,
        userOperationHash,
      }),
    ).toEqual({
      ok: true,
      value: {
        asset,
        fromBlock: "0x10",
        sender,
        userOperationHash,
      },
    });
  });

  it("rejects malformed hashes, addresses, quantities, and unknown keys", () => {
    expect(
      validateInclusionRequest({
        sender,
        userOperationHash: "0x1234",
      }).ok,
    ).toBe(false);
    expect(
      validateInclusionRequest({
        sender: "not-an-address",
        userOperationHash,
      }).ok,
    ).toBe(false);
    expect(
      validateInclusionRequest({
        sender,
        userOperationHash,
        fromBlock: "latest",
      }).ok,
    ).toBe(false);
    expect(
      validateInclusionRequest({
        sender,
        userOperationHash,
        extra: true,
      }).ok,
    ).toBe(false);
  });
});

describe("Monad inclusion helpers", () => {
  it("derives a bounded default search range near the latest block", () => {
    expect(deriveDefaultFromBlock("0x100")).toBe("0x0");
    expect(deriveDefaultFromBlock("0x2000")).toBe(
      `0x${(BigInt("0x2000") - DEFAULT_INCLUSION_SEARCH_BLOCKS + BigInt(1)).toString(16)}`,
    );
  });

  it("chunks eth_getLogs ranges inclusively", () => {
    expect(createLogBlockRanges("0x10", "0x15", BigInt(2))).toEqual([
      { fromBlock: "0x10", toBlock: "0x11" },
      { fromBlock: "0x12", toBlock: "0x13" },
      { fromBlock: "0x14", toBlock: "0x15" },
    ]);
  });

  it("formats ERC20 balanceOf calldata for sender state diagnostics", () => {
    expect(buildBalanceOfCall(sender)).toBe(
      "0x70a0823100000000000000000000000053757d719de5e90739939b7118815510d41eedf2",
    );
  });

  it("extracts the first EntryPoint transaction hash for the requested userOp", () => {
    const logs: EntryPointUserOperationLog[] = [
      {
        address: MONAD_ENTRY_POINT_ADDRESSES[0],
        blockNumber: "0x123",
        topics: [
          USER_OPERATION_EVENT_TOPIC,
          userOperationHash,
        ],
        transactionHash,
      },
    ];

    expect(readIncludedTransactionHash(logs, userOperationHash)).toBe(
      transactionHash,
    );
    expect(readIncludedTransactionHash(logs, `0x${"56".repeat(32)}`)).toBeUndefined();
  });
});
