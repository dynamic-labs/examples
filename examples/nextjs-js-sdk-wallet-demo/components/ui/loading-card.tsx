"use client";

import type { ReactNode } from "react";
import { WidgetCard } from "@/components/ui/widget-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface LoadingCardProps {
  /** Icon to display in card header */
  icon: ReactNode;
  /** Card title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Loading message to display */
  message?: string;
  /** Called when close button is clicked */
  onClose?: () => void;
}

/**
 * Reusable loading state card
 */
export function LoadingCard({
  icon,
  title,
  subtitle,
  message,
  onClose,
}: LoadingCardProps) {
  return (
    <WidgetCard icon={icon} title={title} subtitle={subtitle} onClose={onClose}>
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <LoadingSpinner size="lg" />
        {message && <p className="text-sm text-(--widget-muted)">{message}</p>}
      </div>
    </WidgetCard>
  );
}
