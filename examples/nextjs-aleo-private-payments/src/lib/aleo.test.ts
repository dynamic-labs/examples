import { describe, expect, it } from "vitest";
import {
  creditsToMicrocredits,
  formatMicrocredits,
  isAleoAddress,
  readRecordMicrocredits,
  selectSpendableRecord,
  sumRecordMicrocredits,
} from "./aleo";

const record = (microcredits: string) =>
  `{\n  owner: aleo1velma7dinkley.private,\n  microcredits: ${microcredits}u64.private,\n  _nonce: 4204group.public\n}`;

describe("isAleoAddress", () => {
  it("accepts a bech32 aleo address", () => {
    expect(isAleoAddress("aleo1velma7dinkley")).toBe(true);
  });

  it("rejects addresses from other chains and malformed input", () => {
    expect(isAleoAddress("0x53757D719dE5e90739939B7118815510d41eEdF2")).toBe(
      false,
    );
    expect(isAleoAddress("aleo1VELMA")).toBe(false);
    expect(isAleoAddress("aleo1")).toBe(false);
  });
});

describe("creditsToMicrocredits", () => {
  it("scales whole and fractional credits by 1e6", () => {
    expect(creditsToMicrocredits("1")).toBe(BigInt(1_000_000));
    expect(creditsToMicrocredits(" 1.5 ")).toBe(BigInt(1_500_000));
    expect(creditsToMicrocredits("0.000001")).toBe(BigInt(1));
  });

  it("rejects amounts that cannot be represented or spent", () => {
    expect(() => creditsToMicrocredits("0.0000001")).toThrow(
      "at most 6 decimal places",
    );
    expect(() => creditsToMicrocredits("0")).toThrow("greater than zero");
    expect(() => creditsToMicrocredits("1,5")).toThrow("amount in credits");
  });
});

describe("formatMicrocredits", () => {
  it("renders microcredits as credits without trailing zeros", () => {
    expect(formatMicrocredits(BigInt(1_500_000))).toBe("1.5");
    expect(formatMicrocredits(BigInt(2_000_000))).toBe("2");
    expect(formatMicrocredits(BigInt(1))).toBe("0.000001");
    expect(formatMicrocredits(BigInt(0))).toBe("0");
  });
});

describe("readRecordMicrocredits", () => {
  it("reads the microcredits field from a record plaintext", () => {
    expect(readRecordMicrocredits(record("4500000"))).toBe(BigInt(4_500_000));
  });

  it("returns null for records that are not spendable credits plaintext", () => {
    expect(readRecordMicrocredits({ microcredits: 10 })).toBeNull();
    expect(readRecordMicrocredits("record1ciphertextonly")).toBeNull();
  });
});

describe("sumRecordMicrocredits", () => {
  it("adds up every credits record and ignores the rest", () => {
    expect(
      sumRecordMicrocredits([record("1000000"), record("250000"), "scoobysnack"]),
    ).toBe(BigInt(1_250_000));
  });
});

describe("selectSpendableRecord", () => {
  it("picks the smallest record that covers the amount on its own", () => {
    expect(
      selectSpendableRecord({
        microcredits: BigInt(1_000_000),
        records: [record("5000000"), record("1200000"), record("900000")],
      }),
    ).toBe(record("1200000"));
  });

  it("returns null when the balance is split across too many records", () => {
    expect(
      selectSpendableRecord({
        microcredits: BigInt(1_000_000),
        records: [record("600000"), record("500000")],
      }),
    ).toBeNull();
  });
});
