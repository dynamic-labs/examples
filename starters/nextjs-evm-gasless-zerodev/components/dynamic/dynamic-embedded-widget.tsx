"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { DynamicEmbeddedWidget as DynamicEmbeddedWidgetComponent } from "@/lib/dynamic";
import { useShadowDom } from "@/lib/shadow-dom/shadow-context";

export default function DynamicEmbeddedWidget() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { setHostEl } = useShadowDom();
  const { overlayNode, isOverlayOpen } = useShadowDom();

  useEffect(() => {
    if (containerRef.current) {
      setHostEl(containerRef.current);
    }
    return () => {
      // Only clear hostEl if the container is still in the document
      // This prevents cleanup from interfering with re-initialization during navigation
      if (containerRef.current && document.contains(containerRef.current)) {
        setHostEl(null);
      }
    };
  }, [setHostEl]);

  return (
    <div ref={containerRef} className="relative">
      <DynamicEmbeddedWidgetComponent background="default" />
      {isOverlayOpen &&
        containerRef.current &&
        createPortal(
          <div className="absolute inset-0 z-[10000]">{overlayNode}</div>,
          containerRef.current
        )}
    </div>
  );
}
