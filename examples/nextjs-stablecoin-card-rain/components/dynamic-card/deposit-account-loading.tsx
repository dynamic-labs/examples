import { Loader2 } from "lucide-react";

export default function DepositAccountLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          Creating your account...
        </p>
        <p className="text-xs text-muted-foreground/60">
          We're working with our 3rd-party partner to create your secure deposit
          account. This account will allow you to deposit stablecoins to your
          card for spending. This may take a few minutes.
        </p>
      </div>
    </div>
  );
}
