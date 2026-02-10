"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ScrollableWithFadeProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxHeight?: string;
}

/**
 * Scrollable container with top/bottom fade overlays that appear when content
 * can be scrolled, matching the wallet list effect.
 */
export function ScrollableWithFade({
  children,
  className,
  contentClassName,
  maxHeight = "max-h-80",
}: ScrollableWithFadeProps) {
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const checkScrollState = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const canScrollUp = el.scrollTop > 0;
    const canScrollDown =
      el.scrollHeight > el.clientHeight &&
      el.scrollTop < el.scrollHeight - el.clientHeight - 1;
    setScrollState({ canScrollUp, canScrollDown });
  }, []);

  const scrollRefCallback = useCallback(
    (el: HTMLDivElement | null) => {
      scrollRef.current = el;
      checkScrollState(el);
    },
    [checkScrollState],
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => checkScrollState(scrollRef.current));
    return () => cancelAnimationFrame(id);
  }, [children, checkScrollState]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      checkScrollState(e.currentTarget);
    },
    [checkScrollState],
  );

  return (
    <div className={cn("relative", className)}>
      {/* Top fade when can scroll up */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-6 pointer-events-none z-10",
          "bg-linear-to-b from-(--widget-bg) to-transparent",
          "transition-opacity duration-200",
          scrollState.canScrollUp ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={scrollRefCallback}
        onScroll={handleScroll}
        className={cn(
          maxHeight,
          "overflow-y-auto -mx-1 px-1 scrollbar-thin",
          contentClassName,
        )}
      >
        {children}
      </div>

      {/* Bottom fade when can scroll down */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10",
          "bg-linear-to-t from-(--widget-bg) to-transparent",
          "transition-opacity duration-200",
          scrollState.canScrollDown ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
