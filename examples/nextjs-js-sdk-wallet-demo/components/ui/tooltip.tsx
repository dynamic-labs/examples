"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

/**
 * Styled tooltip component that appears on hover
 * Uses portal to render outside container and avoid overflow clipping
 */
export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Handle SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position when visible
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = tooltipRef.current.offsetWidth;

      setPosition({
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2 - tooltipWidth / 2,
      });
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            className={cn(
              "fixed z-[9999]",
              "px-2 py-1 text-[11px] whitespace-nowrap",
              "bg-(--widget-row-bg) text-(--widget-fg) border border-(--widget-border)",
              "rounded-md shadow-sm",
              "transition-opacity duration-150",
              isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
            style={{ top: position.top, left: position.left }}
            role="tooltip"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
