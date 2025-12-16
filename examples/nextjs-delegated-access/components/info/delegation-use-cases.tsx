import { Zap, Check } from "lucide-react";

const useCases = [
  "Automated DCA (Dollar Cost Averaging)",
  "Scheduled token transfers",
  "Recurring subscription payments",
  "Automated yield harvesting",
  "Bot trading strategies",
  "Gasless meta-transactions",
];

export default function DelegationUseCases() {
  return (
    <div className="rounded-xl border bg-card/50 p-6 space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <Zap className="w-4 h-4 text-muted-foreground" />
        Common Use Cases
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {useCases.map((useCase) => (
          <div key={useCase} className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{useCase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
