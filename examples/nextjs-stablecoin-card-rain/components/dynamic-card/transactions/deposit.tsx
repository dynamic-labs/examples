import { CollateralTransactionResponse } from "@/lib/rain";
import { formatBalance } from "@/utils/format-balance";
import { formatDate } from "@/utils/format-date";
import { DollarSign } from "lucide-react";

interface DepositTransactionProps {
  transaction: CollateralTransactionResponse;
}

export default function DepositTransaction({
  transaction,
}: DepositTransactionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">Deposit</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(transaction.collateral.postedAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-foreground">
          {formatBalance(transaction.collateral.amount)}
        </span>
      </div>
    </div>
  );
}
