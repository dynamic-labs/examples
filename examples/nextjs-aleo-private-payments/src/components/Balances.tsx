"use client";

import { useGetNativeBalance } from "@dynamic-labs-sdk/react-hooks";
import type { AleoWalletAccount } from "@dynamic-labs-sdk/aleo";
import { formatMicrocredits, sumRecordMicrocredits } from "@/lib/aleo";
import { usePrivateRecords } from "@/lib/hooks/usePrivateRecords";
import { CARD } from "@/lib/styles";

/**
 * An Aleo balance has two halves and they are read very differently. The public
 * balance lives in the `credits.aleo` account mapping and any RPC can read it,
 * which is what `useGetNativeBalance` does. The private balance is the sum of
 * the wallet's encrypted records, so only the wallet can report it.
 */
export function Balances({
  walletAccount,
}: {
  walletAccount: AleoWalletAccount;
}) {
  const { data: nativeBalance, isPending: isPublicPending } =
    useGetNativeBalance({ walletAccount });

  const {
    data: records,
    error: recordsError,
    isPending: isPrivatePending,
  } = usePrivateRecords(walletAccount);

  const privateBalance = records ? sumRecordMicrocredits(records) : null;

  return (
    <div className={`${CARD} space-y-4`}>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          Private balance
        </p>
        <p className="text-2xl font-medium tabular">
          {isPrivatePending || privateBalance === null
            ? "…"
            : `${formatMicrocredits(privateBalance)} ALEO`}
        </p>
        <p className="text-xs text-muted">
          {records ? `${records.length} record(s)` : "Reading records…"}
        </p>
        {recordsError && (
          <p className="text-xs text-red-600">{recordsError.message}</p>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          Public balance
        </p>
        <p className="text-lg tabular">
          {isPublicPending ? "…" : `${nativeBalance?.balance ?? "0"} ALEO`}
        </p>
      </div>

      <p className="text-xs text-muted font-mono break-all">
        {walletAccount.address}
      </p>
    </div>
  );
}
