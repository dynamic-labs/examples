"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text or custom ReactNode for complex labels */
  label?: ReactNode;
  error?: string;
}

/**
 * Text input with optional label and error state
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    // Generate ID from label if it's a string
    const labelText = typeof label === "string" ? label : undefined;
    const inputId = id || labelText?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-(--widget-muted) tracking-[-0.12px]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-10 px-3 text-sm",
            "bg-(--widget-bg) text-(--widget-fg)",
            "border border-(--widget-border) rounded-(--widget-radius)",
            "placeholder:text-(--widget-muted)",
            "focus:outline-none focus:ring-2 focus:ring-(--widget-accent) focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-(--widget-error) focus:ring-(--widget-error)",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-(--widget-error)">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
