"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { Loader2 } from "lucide-react";
import { BASESCAN_URL, USDC_DECIMALS } from "@/lib/constants";
import {
  useLendingOperations,
  type Balances,
} from "@/lib/hooks";
import { useWallet } from "@/lib/providers";

type Mode = "supply" | "withdraw";

/** Parses user input, returning null when it is not a usable amount. */
function parseAmount(value: string): bigint | null {
  if (!value.trim()) return null;
  try {
    const parsed = parseUnits(value, USDC_DECIMALS);
    return parsed > 0n ? parsed : null;
  } catch {
    return null;
  }
}

export function SupplyWithdrawForm({
  balances,
  balancesError,
}: {
  balances?: Balances;
  /** True when the on-chain balance read failed, as opposed to still loading. */
  balancesError?: boolean;
}) {
  const { evmAccount, loggedIn } = useWallet();
  const { tx, reset, approve, supply, withdraw, withdrawMax } =
    useLendingOperations(evmAccount);

  const [mode, setMode] = useState<Mode>("supply");
  const [value, setValue] = useState("");
  // The Max click is remembered explicitly: the supplied balance grows with
  // every exchange-rate tick, so inferring "max" from an equality check goes
  // stale within one 5s poll and would silently leave dust behind.
  const [isMax, setIsMax] = useState(false);
  // Set when an approval was mined but the supply chained onto it failed, so
  // the user is told an allowance is now standing rather than left to guess.
  const [approvalStands, setApprovalStands] = useState(false);
  // Held for the entire submit flow. tx.phase alone cannot drive the disabled
  // state: between the approval resolving ("success") and the chained supply
  // dispatching ("pending"), no phase is in flight — the button would re-enable
  // for a moment in the middle of a flow the user cannot safely re-enter.
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = parseAmount(value);
  const maxAmount =
    mode === "supply" ? (balances?.walletUsdc ?? 0n) : (balances?.suppliedUsdc ?? 0n);
  // Only meaningful once balances have loaded. Before that the form disables
  // submission below without claiming anything about the user's funds.
  const exceedsBalance =
    balances !== undefined && amount !== null && amount > maxAmount;
  const needsApproval =
    mode === "supply" && amount !== null && (balances?.allowance ?? 0n) < amount;

  const isBusy =
    isSubmitting ||
    tx.phase === "switching" ||
    tx.phase === "approving" ||
    tx.phase === "pending";
  const canSubmit =
    !isBusy &&
    amount !== null &&
    !exceedsBalance &&
    loggedIn &&
    balances !== undefined;

  const setMax = () => {
    setValue(formatUnits(maxAmount, USDC_DECIMALS));
    setIsMax(true);
  };

  /** The submit button doubles as the progress indicator for the transaction. */
  function submitLabel() {
    if (tx.phase === "switching") return "Switching to Base…";
    if (tx.phase === "approving") return "Approving USDC…";
    if (tx.phase === "pending") {
      return mode === "supply" ? "Supplying…" : "Withdrawing…";
    }
    // Between chained steps no phase is in flight but the flow still is —
    // keep the in-flight label rather than flashing the resting one.
    if (isSubmitting) {
      return mode === "supply" ? "Supplying…" : "Withdrawing…";
    }
    if (needsApproval) return "Approve & Supply";
    return mode === "supply" ? "Supply" : "Withdraw";
  }

  function successLabel() {
    if (tx.action === "supply") return "Supply confirmed.";
    if (tx.action === "withdrawal") return "Withdrawal confirmed.";
    return "Transaction confirmed.";
  }

  const clearInput = () => {
    setValue("");
    setIsMax(false);
  };

  const handleSubmit = async () => {
    if (!amount) return;
    setApprovalStands(false);
    setIsSubmitting(true);
    try {
      if (mode === "supply") {
        const approving = needsApproval;
        // Approval and supply are one click. The error is already on screen if
        // the approval itself failed.
        if (approving && !(await approve(amount))) return;
        // A supply straight after an approval may simulate before the new
        // allowance is readable. Retrying the simulate absorbs that rather than
        // making the user press Supply a second time; without a preceding
        // approval an allowance error is real, so it surfaces at once.
        const supplied = await supply(amount, approving ? 20 : 1);
        // The amount is only cleared on success: after a failure the user needs
        // it on screen to retry, next to the error explaining what happened.
        if (supplied) clearInput();
        else if (approving) setApprovalStands(true);
        return;
      }
      // A "withdraw everything" request redeems the mToken balance outright so
      // no dust is left behind by an exchange-rate tick between quote and mining.
      const isFullWithdrawal = isMax || (amount === maxAmount && maxAmount > 0n);
      const withdrew =
        isFullWithdrawal && balances
          ? await withdrawMax(balances.mTokenBalance)
          : await withdraw(amount);
      if (withdrew) clearInput();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line p-4 space-y-4">
      <div className="flex gap-6 border-b border-line">
        {(["supply", "withdraw"] as const).map((tab) => (
          <button
            key={tab}
            disabled={isBusy}
            onClick={() => {
              setMode(tab);
              clearInput();
              setApprovalStands(false);
              reset();
            }}
            className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 pb-3 -mb-px text-sm capitalize border-b-2 transition-colors ${
              mode === tab
                ? "border-brand text-brand font-bold"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm text-muted">Amount</label>
          <button
            type="button"
            onClick={setMax}
            disabled={isBusy || balances === undefined}
            className="cursor-pointer text-xs font-medium text-brand hover:underline disabled:opacity-40"
          >
            Max
          </button>
        </div>
        <div
          className={`flex items-center rounded-lg border px-3 ${
            exceedsBalance ? "border-red-600" : "border-line"
          }`}
        >
          {/*
            A text input, not `type="number"`. A number input renders its value
            through the browser locale, so "4.000045" displays as "4,000045" for
            a comma-decimal user — indistinguishable from four million in an
            amount field. It also mutates the value on scroll. The pattern below
            accepts digits and a single dot with at most six decimals — USDC's
            precision — so `parseUnits` never silently rounds what was typed.
          */}
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(e) => {
              const next = e.target.value.replace(",", ".");
              if (next === "" || /^\d*\.?\d{0,6}$/.test(next)) {
                setValue(next);
                setIsMax(false);
              }
            }}
            placeholder="0.00"
            disabled={isBusy}
            className="tabular flex-1 py-2.5 text-sm bg-transparent outline-none"
          />
          <span className="text-sm font-medium text-muted">USDC</span>
        </div>
        {exceedsBalance && (
          <p className="text-xs text-red-600">
            {mode === "supply"
              ? "Amount exceeds your wallet balance"
              : "Amount exceeds your supplied balance"}
          </p>
        )}
        {loggedIn && balances === undefined && (
          <p
            className={`text-xs ${balancesError ? "text-red-600" : "text-muted"}`}
          >
            {balancesError
              ? "Could not read your balances — retrying in the background."
              : "Loading balances…"}
          </p>
        )}
      </div>

      {!loggedIn ? (
        <p className="text-center text-sm font-medium py-2.5 rounded-lg border border-line text-muted">
          Sign in to {mode}
        </p>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="cursor-pointer w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg bg-brand hover:bg-brand/90 text-white transition-colors disabled:bg-line disabled:text-muted disabled:cursor-not-allowed"
        >
          {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel()}
        </button>
      )}

      {tx.phase === "error" && (
        <p className="p-2.5 rounded-lg text-xs bg-red-50 text-red-600 break-words">
          {tx.error}
          {approvalStands &&
            " Your USDC approval did go through, so the allowance is in place — submitting again will not re-approve."}
          {tx.hash && (
            <>
              {" "}
              <a
                href={`${BASESCAN_URL}/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on Basescan
              </a>
            </>
          )}
        </p>
      )}

      {/* Suppressed while the flow is still running: the approval's own
          "confirmed" state is an implementation detail mid-chain, not an
          invitation to interact. */}
      {tx.phase === "success" && !isSubmitting && (
        <p className="p-2.5 rounded-lg text-xs bg-green-50 text-green-700">
          {successLabel()}{" "}
          {tx.hash && (
            <a
              href={`${BASESCAN_URL}/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Basescan
            </a>
          )}
        </p>
      )}
    </div>
  );
}
