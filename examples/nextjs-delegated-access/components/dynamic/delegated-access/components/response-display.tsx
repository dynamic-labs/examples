"use client";

import { useState } from "react";
import { Check, Copy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResponseDisplayProps {
  result: string;
  error: string | null;
  onClear: () => void;
}

export default function ResponseDisplay({
  result,
  error,
  onClear,
}: ResponseDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!result && !error) return null;

  const handleCopy = () => {
    const textToCopy = error ? String(error) : result;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="mt-3 rounded-lg border bg-muted/30 overflow-hidden">
      <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Response
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 text-xs px-2"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
      <div className="p-3">
        {error ? (
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
            <pre className="font-mono text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-all">
              {error}
            </pre>
          </div>
        ) : (
          <pre className="font-mono text-xs whitespace-pre-wrap break-all max-h-48 overflow-auto">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}
