"use client";

import { useLogout, useUser } from "@dynamic-labs-sdk/react-hooks";
import { Login } from "@/components/Login";
import { Balances } from "@/components/Balances";
import { SendForm } from "@/components/SendForm";
import { useAleoAccount } from "@/lib/hooks/useAleoAccount";
import { CARD } from "@/lib/styles";

export default function Home() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const aleoAccount = useAleoAccount();

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium">Aleo private payments</h1>
          <p className="text-sm text-muted">
            {user?.email ?? "Send shielded ALEO credits"}
          </p>
        </div>
        {user && (
          <button
            onClick={() => logout()}
            className="cursor-pointer text-xs text-muted hover:text-ink"
          >
            Log out
          </button>
        )}
      </header>

      {!user && <Login />}

      {user && !aleoAccount && (
        <p className={`${CARD} text-sm text-muted`}>
          Creating your embedded Aleo wallet…
        </p>
      )}

      {user && aleoAccount && (
        <>
          <Balances walletAccount={aleoAccount} />
          <SendForm walletAccount={aleoAccount} />
        </>
      )}
    </main>
  );
}
