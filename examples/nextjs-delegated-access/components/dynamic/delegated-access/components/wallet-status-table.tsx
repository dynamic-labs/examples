import { ClipboardList, Check, Circle } from "lucide-react";

interface WalletStatus {
  address: string;
  status: string;
}

interface WalletStatusTableProps {
  walletStatuses: WalletStatus[];
}

export default function WalletStatusTable({
  walletStatuses,
}: WalletStatusTableProps) {
  if (walletStatuses.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Wallet Delegation Details</h3>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                Wallet
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {walletStatuses.map((wallet) => (
              <tr key={wallet.address}>
                <td className="px-4 py-3">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                  </code>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      wallet.status === "delegated"
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {wallet.status === "delegated" ? (
                      <>
                        <Check className="w-3 h-3" />
                        Delegated
                      </>
                    ) : (
                      <>
                        <Circle className="w-3 h-3" />
                        Not Delegated
                      </>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
