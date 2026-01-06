import { BodyText } from "@/components/ui/Typography";
import { LoadingSpinner } from "../components/LoadingSpinner";

interface AmountSelectionViewProps {
  amount: string;
  isLoading: boolean;
  onAmountSelect: (amount: string) => void;
  onContinue: () => void;
}

const PRESET_AMOUNTS = ["3", "5", "10"];

export function AmountSelectionView({
  amount,
  isLoading,
  onAmountSelect,
  onContinue,
}: AmountSelectionViewProps) {
  const isValidAmount = amount && parseFloat(amount) > 0;

  return (
    <div className="p-[16px]">
      <BodyText className="mb-[32px] text-center">
        Select an amount to add
      </BodyText>

      {/* Preset Amount Buttons */}
      <div className="grid grid-cols-3 gap-[12px] mb-[20px]">
        {PRESET_AMOUNTS.map((presetAmount) => (
          <button
            key={presetAmount}
            type="button"
            onClick={() => onAmountSelect(presetAmount)}
            className={`px-[16px] py-[16px] rounded-[12px] font-semibold text-lg transition-colors cursor-pointer ${
              amount === presetAmount
                ? "bg-[#72D0ED] text-[#242735]"
                : "bg-[#2a2f42] text-[#dde2f6] hover:bg-[#32364a]"
            }`}
          >
            ${presetAmount}
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <button
        type="button"
        onClick={onContinue}
        disabled={!isValidAmount || isLoading}
        className="w-full px-[16px] py-[16px] bg-[#72D0ED] rounded-[12px] font-semibold text-base text-[#242735] hover:bg-[#5fb8d0] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#72D0ED] flex items-center justify-center gap-[8px]"
      >
        {isLoading ? (
          <LoadingSpinner size="sm" text="Processing..." />
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
}
