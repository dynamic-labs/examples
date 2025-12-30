"use client";

import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import GaslessTransactionDemo from "@/components/gasless-transaction-demo";

export default function Home() {
  const isLoggedIn = useIsLoggedIn();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Gasless Solana Transactions</h1>
          <p className="text-muted-foreground">
            Powered by Dynamic SDK and Kora
          </p>
        </div>

        <div className="flex justify-center">
          <DynamicWidget />
        </div>

        {isLoggedIn && (
          <div className="mt-8">
            <GaslessTransactionDemo />
          </div>
        )}

        {!isLoggedIn && (
          <div className="text-center text-muted-foreground mt-8">
            Connect your Solana wallet to get started
          </div>
        )}
      </div>
    </main>
  );
}

