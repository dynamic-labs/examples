import { ShieldCheck } from "lucide-react";

interface DelegationStatusHeaderProps {
  isEnabled: boolean;
}

export default function DelegationStatusHeader({
  isEnabled,
}: DelegationStatusHeaderProps) {
  return (
    <div
      className="px-6 py-4"
      style={{ background: "linear-gradient(to right, #4679FE, #6B8AFE)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Delegation Status</h2>
            <p
              className="text-xs"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Manage your wallet delegation
            </p>
          </div>
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            isEnabled ? "bg-white text-green-600" : "bg-white/20 text-white/80"
          }`}
        >
          {isEnabled ? "● Enabled" : "○ Disabled"}
        </div>
      </div>
    </div>
  );
}
