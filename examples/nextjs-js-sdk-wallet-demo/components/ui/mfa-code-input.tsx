"use client";

import { Shield } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MfaCodeInputProps {
  /** Current code value */
  value: string;
  /** Called when code changes */
  onChange: (value: string) => void;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Optional label (default "Authenticator Code") */
  label?: string;
  /** Optional placeholder (default "000000") */
  placeholder?: string;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Show contained box style (with shield icon header) */
  contained?: boolean;
  /** Optional message to show above input (only for contained style) */
  helperMessage?: string;
}

/**
 * MFA code input with numeric-only handling
 *
 * Two styles:
 * - Default: Simple labeled input
 * - Contained: Boxed style with shield icon header (matches network selector)
 */
export function MfaCodeInput({
  value,
  onChange,
  disabled = false,
  label = "Authenticator Code",
  placeholder = "000000",
  autoFocus = false,
  contained = false,
  helperMessage,
}: MfaCodeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    onChange(e.target.value.replace(/\D/g, ""));
  };

  // Simple labeled input style
  if (!contained) {
    return (
      <Input
        label={label}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
      />
    );
  }

  // Contained box style
  return (
    <div className="p-3 bg-(--widget-row-bg) border border-(--widget-border) rounded-(--widget-radius)">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-(--widget-accent)" />
        <span className="text-xs font-medium text-(--widget-fg)">
          Security Verification
        </span>
      </div>
      {helperMessage && (
        <p className="text-xs text-(--widget-muted) mb-2">{helperMessage}</p>
      )}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={handleChange}
        placeholder="Enter 6-digit code"
        disabled={disabled}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 text-sm bg-(--widget-bg) border border-(--widget-border) rounded-(--widget-radius) text-(--widget-fg) placeholder:text-(--widget-muted) focus:outline-none focus:ring-2 focus:ring-(--widget-accent)/20 focus:border-(--widget-accent) disabled:opacity-50"
      />
    </div>
  );
}
