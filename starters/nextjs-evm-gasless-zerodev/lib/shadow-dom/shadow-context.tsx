"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

interface ShadowDomState {
  hostEl: HTMLElement | null;
  setHostEl: (el: HTMLElement | null) => void;
  overlayNode: ReactNode | null;
  isOverlayOpen: boolean;
  openOverlay: (node: ReactNode) => void;
  closeOverlay: () => void;
}

const ShadowDomContext = createContext<ShadowDomState | undefined>(undefined);

export function ShadowDomProvider({ children }: { children: ReactNode }) {
  const [hostEl, setHostElState] = useState<HTMLElement | null>(null);
  const [overlayNode, setOverlayNode] = useState<ReactNode | null>(null);

  // Improved setHostEl that preserves valid elements and only clears when explicitly set to null
  const setHostEl = useCallback((el: HTMLElement | null) => {
    if (el === null) {
      // Only clear if explicitly set to null
      setHostElState(null);
    } else if (el && document.contains(el)) {
      // Only set if element is still in the document
      setHostElState(el);
    }
    // Ignore invalid elements (not in document) to prevent clearing valid existing hostEl
  }, []);

  const value = useMemo(
    () => ({
      hostEl,
      setHostEl,
      overlayNode,
      isOverlayOpen: overlayNode != null,
      openOverlay: (node: ReactNode) => setOverlayNode(node),
      closeOverlay: () => setOverlayNode(null),
    }),
    [hostEl, setHostEl, overlayNode]
  );
  return (
    <ShadowDomContext.Provider value={value}>
      {children}
    </ShadowDomContext.Provider>
  );
}

export function useShadowDom(): ShadowDomState {
  const ctx = useContext(ShadowDomContext);
  if (!ctx)
    throw new Error("useShadowDom must be used within ShadowDomProvider");
  return ctx;
}
