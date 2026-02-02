"use client";

import { type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
  children: React.ReactNode;
  /** Icon to display in header (enables icon-style header layout) */
  icon?: ReactNode;
  title?: string;
  /** Subtitle - can be string or ReactNode for custom content */
  subtitle?: ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Card container with optional header
 *
 * Header layouts:
 * - With icon: [back?] [icon] [title/subtitle] ... [close?]
 * - Without icon: [back?] ... [title/subtitle centered] ... [close?]
 */
export function WidgetCard({
  children,
  icon,
  title,
  subtitle,
  onBack,
  onClose,
  className,
}: WidgetCardProps) {
  const showHeader = title || subtitle || onBack || onClose || icon;

  return (
    <div
      className={cn(
        "bg-(--widget-bg) text-(--widget-fg)",
        "rounded-(--widget-radius-lg) overflow-hidden",
        "border border-(--widget-border)",
        "shadow-[0px_8px_8px_-4px_rgba(10,13,18,0.03),0px_3px_3px_-1.5px_rgba(10,13,18,0.04)",
        className,
      )}
    >
      {showHeader && (
        <div
          className={cn(
            "flex items-start justify-between p-3 border-b border-(--widget-border)",
            !icon && "items-center",
          )}
        >
          {/* Left side: back button and/or icon with title */}
          <div className="flex items-center gap-2">
            {/* Back Button - shown in both layouts when onBack provided */}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-6 h-6 flex items-center justify-center shrink-0 cursor-pointer rounded-full hover:bg-(--widget-row-hover) transition-all"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-(--widget-muted)" />
              </button>
            )}

            {/* Icon-style header: icon box + title */}
            {icon ? (
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] min-w-[38px] flex items-center justify-center rounded-[9px] bg-(--widget-row-bg) border border-(--widget-border) shadow-[0px_0px_1px_-1px_rgba(0,0,0,0.04),0px_2px_4px_-1px_rgba(0,0,0,0.07)]">
                  {icon}
                </div>
                <div className="flex flex-col">
                  {title && (
                    <h2 className="text-sm font-medium text-(--widget-fg) tracking-[-0.14px] leading-5">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-xs text-(--widget-muted) tracking-[-0.12px] leading-5">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Centered title/subtitle (no icon) - needs spacer for centering */
              !onBack && <div className="w-6" />
            )}
          </div>

          {/* Centered title when no icon (original centered layout) */}
          {!icon && (title || subtitle) && (
            <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-2">
              {title && (
                <h2 className="text-sm font-medium text-(--widget-fg) tracking-[-0.14px] leading-5">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-(--widget-muted) tracking-[-0.12px] leading-5">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={!onClose}
            className={cn(
              "w-6 h-6 flex items-center justify-center shrink-0 transition-all rounded-full",
              onClose
                ? "opacity-100 cursor-pointer hover:bg-(--widget-row-hover)"
                : "opacity-0 pointer-events-none",
            )}
            aria-label="Close"
          >
            <X className="w-4 h-4 text-(--widget-muted)" />
          </button>
        </div>
      )}

      <div className={showHeader ? "p-3" : ""}>{children}</div>
    </div>
  );
}
