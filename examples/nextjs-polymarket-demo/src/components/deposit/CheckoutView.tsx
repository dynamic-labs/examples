import { useEffect, useState } from "react";
import { CheckoutFlow } from "../checkout-flow/CheckoutFlow";

interface CheckoutViewProps {
  walletAddress: string;
  onViewChange: (view: "amount" | "payment") => void;
  view?: "amount" | "payment";
}

export function CheckoutView({
  walletAddress,
  onViewChange,
  view: externalView,
}: CheckoutViewProps) {
  const [internalView, setInternalView] = useState<"amount" | "payment">("amount");
  
  // Use external view if provided, otherwise use internal state
  const view = externalView ?? internalView;

  // Sync internal state when external view changes
  useEffect(() => {
    if (externalView !== undefined) {
      setInternalView(externalView);
    }
  }, [externalView]);

  const handleViewChange = (newView: "amount" | "payment") => {
    setInternalView(newView);
    onViewChange(newView);
  };

  return (
    <CheckoutFlow
      walletAddress={walletAddress}
      onViewChange={handleViewChange}
      view={view}
    />
  );
}
