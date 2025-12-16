import { Info, ExternalLink } from "lucide-react";

const DOCS_URL =
  "https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/delegated-access/overview";

export default function DelegationInfoBox() {
  return (
    <div className="rounded-xl border border-dynamic/30 bg-dynamic/5 p-4">
      <div className="flex gap-3">
        <div className="shrink-0">
          <Info className="w-5 h-5 text-dynamic" />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">How Delegation Works</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Delegation uses secure MPC (Multi-Party Computation) to split your
            wallet&apos;s signing key. The server receives a share that can only
            sign when combined with Dynamic&apos;s infrastructure, ensuring no
            single party has full control. You can revoke access at any time.
          </p>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline text-dynamic"
          >
            Read the documentation
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
