import { SpendTransactionResponse } from "@/lib/rain";
import { formatBalance } from "@/utils/format-balance";
import { formatDate } from "@/utils/format-date";
import { ArrowUpRight } from "lucide-react";

interface SpendTransactionProps {
  transaction: SpendTransactionResponse;
}

export default function SpendTransaction({
  transaction,
}: SpendTransactionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {transaction.spend.enrichedMerchantName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(transaction.spend.postedAt ?? "")}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-foreground">
          -{formatBalance(transaction.spend.amount)}
        </span>
      </div>
    </div>
  );
}
