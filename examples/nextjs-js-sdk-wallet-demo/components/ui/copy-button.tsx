"use client";

import { Copy, Check } from "lucide-react";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { Tooltip } from "@/components/ui/tooltip";

type Size = "sm" | "md";

interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Button size (sm = 12px icons, md = 16px icons) */
  size?: Size;
  /** Accessible label */
  label?: string;
  /** Show tooltip on hover (default: false) */
  showTooltip?: boolean;
  /** Additional class names */
  className?: string;
}

const sizeClasses: Record<Size, { button: string; icon: string }> = {
  sm: { button: "p-0.5", icon: "w-3 h-3" },
  md: { button: "p-2", icon: "w-4 h-4" },
};

/**
 * Reusable copy-to-clipboard button with success feedback
 */
export function CopyButton({
  text,
  size = "md",
  label = "Copy to clipboard",
  showTooltip = false,
  className = "",
}: CopyButtonProps) {
  const { copied, copy } = useCopyFeedback();
  const styles = sizeClasses[size];

  const button = (
    <button
      type="button"
      onClick={(e) => copy(text, e)}
      className={`rounded hover:bg-black/5 text-(--widget-muted) hover:text-(--widget-fg) transition-colors cursor-pointer ${styles.button} ${className}`}
      aria-label={label}
    >
      {copied ? (
        <Check className={`${styles.icon} text-(--widget-success)`} />
      ) : (
        <Copy className={styles.icon} />
      )}
    </button>
  );

  if (showTooltip) {
    return <Tooltip content={copied ? "Copied!" : label}>{button}</Tooltip>;
  }

  return button;
}
