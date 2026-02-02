"use client";

import { AlertCircle } from "lucide-react";
import { parseError } from "@/lib/get-error-message";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  error: unknown;
  defaultMessage?: string;
  className?: string;
}

/**
 * Error message display component with card styling
 */
export function ErrorMessage({
  error,
  defaultMessage,
  className,
}: ErrorMessageProps) {
  if (!error) return null;

  const { title, description } = parseError(error, defaultMessage);

  if (!title) return null;

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-(--widget-radius) bg-red-50 border border-red-200",
        className,
      )}
    >
      <AlertCircle className="w-5 h-5 text-(--widget-error) flex-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-(--widget-error)">{title}</p>
        {description && (
          <p className="text-xs text-red-600/80 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
