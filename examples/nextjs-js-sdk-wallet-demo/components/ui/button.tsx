"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Show red/danger hover state (for destructive actions like logout) */
  danger?: boolean;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-(--widget-primary) text-white hover:bg-(--widget-primary-hover) shadow-sm",
  secondary:
    "bg-white border border-(--widget-border) text-(--widget-fg) hover:bg-(--widget-row-hover)",
  outline:
    "bg-transparent border border-(--widget-border) text-(--widget-muted) hover:text-(--widget-fg) hover:bg-(--widget-row-hover)",
  ghost:
    "bg-transparent text-(--widget-muted) hover:text-(--widget-fg) hover:bg-(--widget-row-hover)",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: "h-9 px-3 text-xs gap-1.5",
  sm: "h-8 px-3 text-xs gap-1",
  lg: "h-12 px-6 text-base gap-2",
  icon: "w-9 h-9 p-0",
};

/**
 * Reusable button component with variants and loading state
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      loading = false,
      danger = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium",
          "rounded-(--widget-radius) transition-all duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "cursor-pointer",
          BUTTON_VARIANTS[variant],
          BUTTON_SIZES[size],
          // Danger hover state (for destructive actions)
          danger &&
            "hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 hover:border-red-200",
          loading && "animate-pulse",
          className,
        )}
        {...props}
      >
        {loading && <LoadingSpinner size="sm" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
