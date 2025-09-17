import { getAuthToken } from "@/lib/dynamic";
import { TransactionResponse } from "@/lib/rain";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "../ui/skeleton";

import DepositTransaction from "./transactions/deposit";
import SpendTransaction from "./transactions/spend";

export default function CardTransactions() {
  const {
    data,
    isLoading,
    isRefetching,
    refetch: refetchTransactions,
  } = useQuery<{
    transactions: Array<TransactionResponse>;
  }>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const authToken = getAuthToken();
      const response = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      return data;
    },
  });

  return (
    <div className="w-full mt-4">
      <h2 className="text-md font-medium text-muted-foreground mb-4">
        Transaction History
      </h2>
      <div className="flex flex-col gap-4">
        {(() => {
          // Loading state
          if (isLoading || isRefetching) {
            return <Skeleton className="h-10 w-full" />;
          }

          // No transactions state
          if (!data?.transactions || data.transactions.length === 0) {
            return (
              <div className="text-center text-muted-foreground">
                <p className="font-medium text-sm">No transactions</p>
                <p className="text-xs mt-1">
                  Your transaction history will appear here
                </p>
              </div>
            );
          }

          // Show transactions
          return data.transactions.map((transaction) => {
            if (transaction.type === "spend") {
              return (
                <SpendTransaction
                  key={transaction.id}
                  transaction={transaction}
                />
              );
            }
            if (transaction.type === "collateral") {
              return (
                <DepositTransaction
                  key={transaction.id}
                  transaction={transaction}
                />
              );
            }
            if (transaction.type === "fee") {
              return <div key={transaction.id}>Fee</div>;
            }
            if (transaction.type === "payment") {
              return <div key={transaction.id}>Payment</div>;
            }
          });
        })()}
      </div>
    </div>
  );
}
