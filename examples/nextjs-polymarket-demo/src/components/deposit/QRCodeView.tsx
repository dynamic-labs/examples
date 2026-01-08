import { AwesomeQRCode } from "@awesome-qrcode/react";
import { Copy } from "lucide-react";
import { BodyText } from "@/components/ui/Typography";

interface QRCodeViewProps {
  walletAddress: string;
}

export function QRCodeView({ walletAddress }: QRCodeViewProps) {
  const handleCopyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
      } catch (err) {
        console.error("Failed to copy address:", err);
      }
    }
  };

  return (
    <div className="flex flex-col items-center px-[20px] pt-[32px] pb-[20px] min-h-[400px]">
      {/* QR Code */}
      <div className="relative mb-[32px]">
        <div className="w-[280px] h-[280px] p-[16px] flex items-center justify-center">
          <AwesomeQRCode
            value={walletAddress}
            size={280}
            ecLevel="M"
            fgColor="#FFFFFF"
            bgColor="transparent"
            dataStyle="dots"
            eyeRadius={{
              inner: 1.0,
              outer: 0.4,
            }}
            eyeColor="#FFFFFF"
          />
        </div>
        {/* Wallet Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[60px] h-[60px] bg-[#18252E] rounded-full flex items-center justify-center border-4 border-[#242735]">
            <div className="w-[40px] h-[40px] rounded-full bg-linear-to-br from-[#2768FC] via-[#5483F0] to-[#9D4EDD]" />
          </div>
        </div>
      </div>

      {/* Address with Copy Button */}
      <div className="flex items-center gap-[12px] mb-[16px]">
        <BodyText>
          {walletAddress
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            : "No wallet connected"}
        </BodyText>
        <button
          type="button"
          onClick={handleCopyAddress}
          className="w-[20px] h-[20px] flex items-center justify-center text-[rgba(221,226,246,0.6)] hover:text-[#72D0ED] transition-colors cursor-pointer"
          aria-label="Copy address"
        >
          <Copy className="w-[16px] h-[16px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
