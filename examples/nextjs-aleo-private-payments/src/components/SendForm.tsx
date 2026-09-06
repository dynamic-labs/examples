"use client";

import { useState } from "react";
import { getAleoExplorerTxUrl, type AleoWalletAccount } from "@dynamic-labs-sdk/aleo";
import { useSendPrivateCredits } from "@/lib/hooks/useSendPrivateCredits";
import { INPUT, SUBMIT } from "@/lib/styles";

export function SendForm({
  walletAccount,
}: {
  walletAccount: AleoWalletAccount;
}) {
  const [recipient, setRecipient] = useState("");
  const [credits, setCredits] = useState("");

  const { mutate: send, data, error, isPending } =
    useSendPrivateCredits(walletAccount);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={recipient}
        onChange={(event) => setRecipient(event.target.value)}
        placeholder="Recipient (aleo1…)"
        className={`${INPUT} font-mono`}
      />
      <input
        type="text"
        inputMode="decimal"
        value={credits}
        onChange={(event) => setCredits(event.target.value)}
        placeholder="Amount in credits"
        className={INPUT}
      />
      <button
        onClick={() => send({ credits, recipient })}
        disabled={isPending || !recipient || !credits}
        className={SUBMIT}
      >
        {isPending ? "Proving and sending…" : "Send privately"}
      </button>

      <p className="text-xs text-muted">
        The wallet generates a zero-knowledge proof before broadcasting, which
        usually takes 5 to 15 seconds.
      </p>

      {data && (
        <a
          href={getAleoExplorerTxUrl({
            networkId: data.networkId,
            txId: data.transactionId,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-brand hover:underline font-mono break-all"
        >
          {data.transactionId}
        </a>
      )}

      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
