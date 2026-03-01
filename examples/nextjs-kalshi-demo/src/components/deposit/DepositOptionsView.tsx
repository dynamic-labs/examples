import {
  ChevronRight,
  QrCode,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";

interface DepositOptionsViewProps {
  onReceiveByQR: () => void;
  onFundWallet: () => void;
  onLiFi: () => void;
}

export function DepositOptionsView({
  onReceiveByQR,
  onFundWallet,
  onLiFi,
}: DepositOptionsViewProps) {
  return (
    <div className="p-[16px]">
      <OptionButton
        icon={
          <ArrowLeftRight
            className="w-[24px] h-[24px] text-[#06b6d4]"
            strokeWidth={2}
          />
        }
        label="Deposit from Any Chain"
        onClick={onLiFi}
      />
      <OptionButton
        icon={
          <QrCode
            className="w-[24px] h-[24px] text-[#8b5cf6]"
            strokeWidth={2}
          />
        }
        label="Receive by QR"
        onClick={onReceiveByQR}
      />
      <OptionButton
        icon={
          <Wallet
            className="w-[24px] h-[24px] text-[#14b8a6]"
            strokeWidth={2}
          />
        }
        label="From Wallet"
        onClick={onFundWallet}
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
      className="w-full flex items-center justify-between px-[16px] py-[16px] bg-[#1a1b23] rounded-[12px] hover:bg-[#252630] transition-colors cursor-pointer mb-[12px] group border border-[#262a34]"
    >
      <div className="flex items-center gap-[12px]">
        <div className="w-[40px] h-[40px] flex items-center justify-center bg-[#0e1015] rounded-[8px]">
          {icon}
        </div>
        <p className="font-['Clash_Display',sans-serif] text-[16px] text-white font-medium">
          {label}
        </p>
      </div>
      <ChevronRight
        className="w-[20px] h-[20px] text-[rgba(139,92,246,0.4)] group-hover:text-[#8b5cf6] transition-colors"
        strokeWidth={2}
      />
    </button>
  );
}
