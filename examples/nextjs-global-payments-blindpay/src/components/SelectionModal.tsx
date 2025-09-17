import { BankAccount } from "@/types";

interface BlockchainWallet {
  id: string;
  name: string;
  network: string;
  address: string;
  is_account_abstraction: boolean;
  created_at: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type: "bank" | "wallet";
  items: BankAccount[] | BlockchainWallet[];
  selectedId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
}

export default function SelectionModal({
  isOpen,
  onClose,
  title,
  description,
  type,
  items,
  selectedId,
  onSelect,
  onConfirm,
}: SelectionModalProps) {
  if (!isOpen) return null;

  const renderItem = (item: BankAccount | BlockchainWallet) => {
    if (type === "bank") {
      const bankItem = item as BankAccount;
      return (
        <div className="flex-1">
          <h4 className="font-medium text-card-foreground">{bankItem.name}</h4>
          <p className="text-sm text-muted-foreground">
            {bankItem.account_type} • {bankItem.account_class} •{" "}
            {bankItem.country}
          </p>
          <p className="text-sm text-muted-foreground/70">
            Account: ****{bankItem.account_number.slice(-4)}
            {bankItem.routing_number &&
              ` | Routing: ${bankItem.routing_number}`}
          </p>
        </div>
      );
    } else {
      const walletItem = item as BlockchainWallet;
      return (
        <div className="flex-1">
          <h4 className="font-medium text-card-foreground">
            {walletItem.name}
          </h4>
          <p className="text-sm text-muted-foreground capitalize">
            {walletItem.network} Network
            {walletItem.is_account_abstraction && " • Account Abstraction"}
          </p>
          <p className="text-sm text-muted-foreground/70 font-mono">
            {walletItem.address.slice(0, 6)}...{walletItem.address.slice(-4)}
          </p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <p className="text-muted-foreground mb-4 text-sm">{description}</p>

        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedId === item.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border/80"
              }`}
              onClick={() => onSelect(item.id)}
            >
              <div className="flex items-center justify-between">
                {renderItem(item)}
                {selectedId === item.id && (
                  <div className="text-primary">✓</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-input text-foreground rounded-md hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedId}
            className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with Selected {type === "bank" ? "Account" : "Wallet"}
          </button>
        </div>
      </div>
    </div>
  );
}
