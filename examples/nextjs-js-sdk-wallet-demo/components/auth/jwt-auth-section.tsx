"use client";

/**
 * External JWT Authentication Section
 *
 * Collapsible section for signing in with a third-party JWT token.
 * Only visible when External Authentication is enabled in the dashboard.
 *
 * @see https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-overview
 * @see https://www.dynamic.xyz/docs/javascript/external-auth/third-party-auth-usage
 */

import { useState } from "react";
import { ChevronDown, KeyRound, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/error-message";
import { useJwtAuth } from "@/hooks/use-mutations";
import { isExternalAuthEnabled } from "@/lib/dynamic";

/**
 * JWT authentication section — returns null if external auth is not enabled
 */
export function JwtAuthSection() {
  const [jwt, setJwt] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const jwtAuth = useJwtAuth();

  if (!isExternalAuthEnabled()) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt.trim()) return;

    try {
      await jwtAuth.mutateAsync(jwt.trim());
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="border border-(--widget-border) rounded-(--widget-radius) overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-(--widget-muted) hover:text-(--widget-fg) hover:bg-(--widget-row-hover) transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5" />
          Sign in with JWT
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-200 ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <form onSubmit={handleSubmit} className="px-3 pb-3 pt-1 space-y-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="jwt-token"
                className="text-xs font-medium text-(--widget-muted) tracking-[-0.12px]"
              >
                JWT Token
              </label>
              <textarea
                id="jwt-token"
                value={jwt}
                onChange={(e) => setJwt(e.target.value)}
                placeholder="Paste your JWT token here..."
                rows={3}
                disabled={jwtAuth.isPending}
                className="w-full px-3 py-2 text-sm bg-(--widget-bg) text-(--widget-fg) border border-(--widget-border) rounded-(--widget-radius) placeholder:text-(--widget-muted) focus:outline-none focus:ring-2 focus:ring-(--widget-accent) focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none font-mono text-[11px] leading-relaxed"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              loading={jwtAuth.isPending}
              disabled={!jwt.trim()}
            >
              <KeyRound className="w-4 h-4" />
              Authenticate
            </Button>
            <ErrorMessage error={jwtAuth.error} />
            <a
              href="/jwt"
              className="flex items-center justify-center gap-1 text-[11px] text-(--widget-muted) hover:text-(--widget-fg) transition-colors"
            >
              Generate a test token
              <ExternalLink className="w-3 h-3" />
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}
