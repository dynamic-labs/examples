"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import {
  getShadowHosts,
  insertRelative,
  queryFirst,
  InsertPosition,
} from "./shadow-utils";

interface UseShadowAnchorOptions {
  hostRef: RefObject<HTMLElement | null>;
  anchorSelectors?: string[]; // selectors to find anchor inside shadowRoot
  anchorFinder?: (shadowRoot: ShadowRoot) => HTMLElement | null; // custom finder when selectors are not enough
  onAnchorFound?: (anchor: HTMLElement, shadowRoot: ShadowRoot) => void; // side-effects (e.g., hide anchor)
  position?: InsertPosition; // where to place relative to anchor
  mountTestId: string; // to dedupe
}

export function useShadowAnchor({
  hostRef,
  anchorSelectors = [],
  anchorFinder,
  onAnchorFound,
  position = "before",
  mountTestId,
}: UseShadowAnchorOptions) {
  const [mountEl, setMountEl] = useState<HTMLElement | null>(null);
  // Keep the latest callbacks in refs so the effect doesn't re-run on identity changes
  const anchorFinderRef =
    useRef<UseShadowAnchorOptions["anchorFinder"]>(anchorFinder);
  const onAnchorFoundRef =
    useRef<UseShadowAnchorOptions["onAnchorFound"]>(onAnchorFound);
  const anchorSelectorsKeyRef = useRef<string>(anchorSelectors.join("|"));
  const mountRef = useRef<HTMLElement | null>(null);

  anchorFinderRef.current = anchorFinder;
  onAnchorFoundRef.current = onAnchorFound;
  anchorSelectorsKeyRef.current = anchorSelectors.join("|");

  useEffect(() => {
    if (!hostRef.current) return;

    let disposed = false;
    let scheduled = false;
    const observed = new WeakSet<ShadowRoot>();
    const observers: MutationObserver[] = [];

    const ensureMount = () => {
      if (disposed) return;
      scheduled = false;
      const hosts = getShadowHosts(hostRef.current as HTMLElement);
      for (const host of hosts) {
        const shadowRoot = (host as any).shadowRoot as ShadowRoot | null;
        if (!shadowRoot) continue;

        // If an existing mount is present, adopt it and exit
        const existing = shadowRoot.querySelector(
          `[data-testid="${mountTestId}"]`
        ) as HTMLElement | null;
        if (existing && existing.isConnected) {
          if (mountRef.current !== existing) {
            mountRef.current = existing;
            setMountEl(existing);
          }
          return;
        }

        // Find anchor for placement
        let anchor: HTMLElement | null = null;
        const finder = anchorFinderRef.current;
        if (finder) anchor = finder(shadowRoot);
        if (!anchor && anchorSelectorsKeyRef.current.length > 0) {
          anchor = queryFirst<HTMLElement>(
            shadowRoot,
            anchorSelectorsKeyRef.current.split("|")
          );
        }
        if (!anchor) continue;

        const mount = document.createElement("div");
        mount.setAttribute("data-testid", mountTestId);
        insertRelative(anchor, mount, position);
        onAnchorFoundRef.current?.(anchor, shadowRoot);
        mountRef.current = mount;
        setMountEl(mount);
        return;
      }
    };

    const scheduleEnsure = () => {
      if (disposed || scheduled) return;
      scheduled = true;
      Promise.resolve().then(() => ensureMount());
    };

    const observeShadowRoot = (shadowRoot: ShadowRoot) => {
      if (observed.has(shadowRoot)) return;
      observed.add(shadowRoot);
      const obs = new MutationObserver(() => scheduleEnsure());
      obs.observe(shadowRoot, { childList: true, subtree: true });
      observers.push(obs);
    };

    // Observe current hosts
    const seedHosts = getShadowHosts(hostRef.current as HTMLElement);
    for (const host of seedHosts) {
      const shadowRoot = (host as any).shadowRoot as ShadowRoot | null;
      if (shadowRoot) observeShadowRoot(shadowRoot);
    }

    // Observe host to catch new shadow roots appearing
    const hostObs = new MutationObserver(() => {
      const hosts = getShadowHosts(hostRef.current as HTMLElement);
      for (const host of hosts) {
        const shadowRoot = (host as any).shadowRoot as ShadowRoot | null;
        if (shadowRoot) observeShadowRoot(shadowRoot);
      }
      scheduleEnsure();
    });
    hostObs.observe(hostRef.current, { childList: true, subtree: true });
    observers.push(hostObs);

    // Initial
    scheduleEnsure();

    return () => {
      disposed = true;
      observers.forEach((o) => o.disconnect());
    };
  }, [hostRef, position, mountTestId]);

  return mountEl;
}
