import { CheckCircle } from "lucide-react";
import { BodyText, Heading, Label, Value } from "@/components/ui/Typography";

interface SuccessViewProps {
  amount: string;
  onStartNewTransaction: () => void;
}

export function SuccessView({
  amount,
  onStartNewTransaction,
}: SuccessViewProps) {
  return (
    <div className="flex flex-col items-center justify-center px-[20px] py-[30px]">
      {/* Success Icon */}
      <div className="w-[80px] h-[80px] bg-[#2a2f42] rounded-full flex items-center justify-center mb-[24px]">
        <CheckCircle
          className="w-[48px] h-[48px] text-[#72D0ED]"
          strokeWidth={2}
          aria-label="Success checkmark"
        />
      </div>

      <Heading level={3} className="mb-[12px] text-center">
        Payment Successful!
      </Heading>
      <BodyText muted className="mb-[24px] text-center">
        Your funds have been added successfully.
      </BodyText>

      {/* Transaction Details */}
      <div className="w-full bg-[#2a2f42] rounded-[12px] p-[16px] mb-[24px] space-y-[12px]">
        <div className="flex justify-between">
          <Label>Amount</Label>
          <Value size="sm">${amount} USD</Value>
        </div>
        <div className="flex justify-between">
          <Label>Asset</Label>
          <Value size="sm">USDC</Value>
        </div>
        <div className="flex justify-between">
          <Label>Network</Label>
          <Value size="sm" className="capitalize">
            Base
          </Value>
        </div>
      </div>

      {/* Done Button */}
      <button
        type="button"
        onClick={onStartNewTransaction}
        className="w-full px-[16px] py-[16px] bg-[#72D0ED] rounded-[12px] font-semibold text-base text-[#242735] hover:bg-[#5fb8d0] transition-colors cursor-pointer"
      >
        Start New Transaction
      </button>
    </div>
  );
}
