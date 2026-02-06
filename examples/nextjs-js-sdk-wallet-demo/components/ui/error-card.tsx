"use client";

import type { ReactNode } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/error-message";

interface ErrorCardProps {
  /** Optional custom icon (defaults to AlertCircle) */
  icon?: ReactNode;
  /** Card title (defaults to "Error") */
  title?: string;
  /** Error message string */
  message?: string;
  /** Error object (alternative to message) */
  error?: Error | null;
  /** Called when close/back button is clicked */
  onClose?: () => void;
  /** Show back button (default true) */
  showBackButton?: boolean;
  /** Back button text (default "Back") */
  backButtonText?: string;
}

/**
 * Reusable error state card
 */
export function ErrorCard({
  icon,
  title = "Error",
  message,
  error,
  onClose,
  showBackButton = true,
  backButtonText = "Back",
}: ErrorCardProps) {
  const defaultIcon = (
    <AlertCircle
      className="w-[18px] h-[18px] text-(--widget-error)"
      strokeWidth={1.5}
    />
  );

  return (
    <WidgetCard icon={icon ?? defaultIcon} title={title} onClose={onClose}>
      <div className="space-y-4">
        {message && <p className="text-sm text-(--widget-error)">{message}</p>}
        {error && <ErrorMessage error={error} />}
        {showBackButton && onClose && (
          <Button variant="secondary" className="w-full" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
            {backButtonText}
          </Button>
        )}
      </div>
    </WidgetCard>
  );
}
