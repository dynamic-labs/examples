import { Copy } from "lucide-react";

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
      {/* Placeholder for QR Code - requires @awesome-qrcode/react or similar library */}
      <div className="relative mb-[32px]">
        <div className="w-[280px] h-[280px] p-[16px] flex items-center justify-center bg-[#0e1015] rounded-[12px] border border-[#262a34]">
          <div className="text-center">
            <p className="font-['Clash_Display',sans-serif] text-[14px] text-[rgba(139,92,246,0.6)] mb-[8px]">
              QR Code
            </p>
            <p className="font-['Clash_Display',sans-serif] text-[12px] text-[rgba(255,255,255,0.4)]">
              Install @awesome-qrcode/react
              <br />
              to display QR code
            </p>
          </div>
        </div>
        {/* Wallet Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[60px] h-[60px] bg-[#1a1b23] rounded-full flex items-center justify-center border-4 border-[#0e1015]">
            <div className="w-[40px] h-[40px] rounded-full bg-linear-to-br from-[#8b5cf6] via-[#06b6d4] to-[#14b8a6]" />
          </div>
        </div>
      </div>

      {/* Address with Copy Button */}
      <div className="flex items-center gap-[12px] mb-[16px]">
        <p className="font-['Clash_Display',sans-serif] text-[16px] text-white font-medium">
          {walletAddress
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            : "No wallet connected"}
        </p>
        <button
          type="button"
          onClick={handleCopyAddress}
          className="w-[20px] h-[20px] flex items-center justify-center text-[rgba(139,92,246,0.6)] hover:text-[#8b5cf6] transition-colors cursor-pointer"
          aria-label="Copy address"
        >
          <Copy className="w-[16px] h-[16px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
