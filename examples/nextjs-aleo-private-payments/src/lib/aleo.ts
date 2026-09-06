import { MICROCREDITS_PER_CREDIT } from "@dynamic-labs-sdk/aleo";

/** `credits.aleo` holds the native ALEO credits program, including `transfer_private`. */
export const CREDITS_PROGRAM = "credits.aleo";

export const TRANSFER_PRIVATE_FUNCTION = "transfer_private";

/**
 * Aleo literal types for `transfer_private(input_record, receiver, amount)`.
 * The WaaS signer needs them explicitly: it builds the proving circuit from
 * the declared types rather than inferring them from the values.
 */
export const TRANSFER_PRIVATE_INPUT_TYPES = [
  "credits.record",
  "address.private",
  "u64.private",
];

/** Aleo addresses are bech32: `aleo1` plus lowercase alphanumerics. */
const ALEO_ADDRESS_PATTERN = /^aleo1[a-z0-9]{1,62}$/;

/** Record plaintext is an Aleo struct literal, e.g. `microcredits: 4500000u64.private`. */
const RECORD_MICROCREDITS_PATTERN = /microcredits:\s*(\d+)u64/;

export const isAleoAddress = (value: string): boolean =>
  ALEO_ADDRESS_PATTERN.test(value);

/**
 * Converts a human-entered credits amount to the u64 microcredits used on
 * chain. Fractional input beyond 6 decimals has no on-chain representation, so
 * it is rejected instead of silently rounded.
 */
export const creditsToMicrocredits = (credits: string): bigint => {
  const trimmed = credits.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter an amount in credits, for example 1.5");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > 6) {
    throw new Error("ALEO credits have at most 6 decimal places");
  }

  const paddedFraction = fraction.padEnd(6, "0");
  const microcredits =
    BigInt(whole) * BigInt(MICROCREDITS_PER_CREDIT) + BigInt(paddedFraction);

  if (microcredits === BigInt(0)) {
    throw new Error("Amount must be greater than zero");
  }

  return microcredits;
};

export const formatMicrocredits = (microcredits: bigint): string => {
  const divisor = BigInt(MICROCREDITS_PER_CREDIT);
  const whole = microcredits / divisor;
  const fraction = (microcredits % divisor).toString().padStart(6, "0");
  const trimmedFraction = fraction.replace(/0+$/, "");

  if (trimmedFraction === "") {
    return whole.toString();
  }

  return `${whole}.${trimmedFraction}`;
};

/**
 * Reads the `microcredits` field out of a record plaintext. Returns null for
 * anything that is not a spendable credits record, so callers can filter a
 * wallet's raw record list without trusting its shape.
 */
export const readRecordMicrocredits = (record: unknown): bigint | null => {
  if (typeof record !== "string") return null;

  const match = RECORD_MICROCREDITS_PATTERN.exec(record);
  if (!match) return null;

  return BigInt(match[1]);
};

export const sumRecordMicrocredits = (records: unknown[]): bigint =>
  records.reduce<bigint>((total, record) => {
    const microcredits = readRecordMicrocredits(record);
    if (microcredits === null) return total;
    return total + microcredits;
  }, BigInt(0));

/**
 * Picks the record that funds a `transfer_private`. A transition spends a
 * single input record, so the send is only possible when one record on its own
 * covers the amount. The smallest sufficient record is chosen to keep the
 * larger ones intact for later sends.
 */
export const selectSpendableRecord = ({
  microcredits,
  records,
}: {
  microcredits: bigint;
  records: unknown[];
}): string | null => {
  const candidates = records
    .filter((record): record is string => typeof record === "string")
    .map((record) => ({ record, value: readRecordMicrocredits(record) }))
    .filter(
      (candidate): candidate is { record: string; value: bigint } =>
        candidate.value !== null && candidate.value >= microcredits,
    )
    .sort((a, b) => {
      if (a.value === b.value) return 0;
      return a.value < b.value ? -1 : 1;
    });

  return candidates[0]?.record ?? null;
};
