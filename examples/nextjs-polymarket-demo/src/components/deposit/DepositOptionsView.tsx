import {
  ChevronRight,
  CreditCard,
  QrCode,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";
import { BodyText } from "@/components/ui/Typography";

interface DepositOptionsViewProps {
  onReceiveByQR: () => void;
  onFundWallet: () => void;
  onAddFunds: () => void;
  onLiFi: () => void;
}

export function DepositOptionsView({
  onReceiveByQR,
  onFundWallet,
  onAddFunds,
  onLiFi,
}: DepositOptionsViewProps) {
  return (
    <div className="p-[16px]">
      <OptionButton
        icon={
          <CreditCard
            className="w-[24px] h-[24px] text-[#72D0ED]"
            strokeWidth={2}
          />
        }
        label="Credit Card"
        onClick={onAddFunds}
      />
      <OptionButton
        icon={
          <QrCode
            className="w-[24px] h-[24px] text-[#72D0ED]"
            strokeWidth={2}
          />
        }
        label="Receive by QR"
        onClick={onReceiveByQR}
        enabled={false}
      />
      <OptionButton
        icon={
          <Wallet
            className="w-[24px] h-[24px] text-[#72D0ED]"
            strokeWidth={2}
          />
        }
        label="From Wallet"
        onClick={onFundWallet}
      />
      <OptionButton
        icon={
          <ArrowLeftRight
            className="w-[24px] h-[24px] text-[#72D0ED]"
            strokeWidth={2}
          />
        }
        label="Deposit"
        onClick={onLiFi}
      />
    </div>
  );
}

function OptionButton({
  icon,
  label,
  onClick,
  enabled = true,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  enabled?: boolean;
}) {
  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-[16px] py-[16px] bg-[#2a2f42] rounded-[12px] hover:bg-[#32364a] transition-colors cursor-pointer mb-[12px] group"
    >
      <div className="flex items-center gap-[12px]">
        <div className="w-[40px] h-[40px] flex items-center justify-center bg-[#18252E] rounded-[8px]">
          {icon}
        </div>
        <BodyText>{label}</BodyText>
      </div>
      <ChevronRight
        className="w-[20px] h-[20px] text-[rgba(221,226,246,0.4)] group-hover:text-[#72D0ED] transition-colors"
        strokeWidth={2}
      />
    </button>
  );
}
