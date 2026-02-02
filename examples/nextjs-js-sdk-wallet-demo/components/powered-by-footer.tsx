import { DynamicLogo } from "@/components/icons/dynamic-logo";

/**
 * "Powered by Dynamic" footer watermark
 * Matches the official Dynamic SDK footer design
 * Server component - renders immediately
 */
export function PoweredByFooter() {
  return (
    <div className="flex items-center justify-center py-2">
      <a
        href="https://dynamic.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
      >
        <span className="text-[11px] text-(--widget-muted)">Powered by</span>
        <DynamicLogo className="text-(--widget-muted)" />
      </a>
    </div>
  );
}
