"use client";

import { useShadowDom } from "@/lib/shadow-dom/shadow-context";
import { useShadowAnchor } from "@/lib/shadow-dom/use-shadow-anchor";
import { MintTokens } from "@/components/mint-tokens";
import { createPortal } from "react-dom";
import { useRef, useState } from "react";

type AnchorFingerprint = {
  tagName: string;
  role: string | null;
  dataTestId: string | null;
  classTokens: string[]; // stable subset of classes
  parentTestId: string | null;
  siblingIndex: number | null;
};

function getStableClassTokens(el: HTMLElement): string[] {
  // Filter out classes that look hashed or dynamic
  const classes = (el.className || "")
    .split(/\s+/)
    .map((c) => c.trim())
    .filter(Boolean);
  return classes.filter((c) => !/__|--|[0-9a-f]{6,}|^css-/.test(c));
}

function fingerprintFromAnchor(el: HTMLElement): AnchorFingerprint {
  const parent = el.parentElement as HTMLElement | null;
  return {
    tagName: el.tagName.toLowerCase(),
    role: el.getAttribute("role"),
    dataTestId: el.getAttribute("data-testid"),
    classTokens: getStableClassTokens(el),
    parentTestId: parent?.getAttribute("data-testid") || null,
    siblingIndex: parent ? Array.from(parent.children).indexOf(el) : null,
  };
}

function findByFingerprint(shadowRoot: ShadowRoot, fp: AnchorFingerprint) {
  const scope = fp.parentTestId
    ? (shadowRoot.querySelector(
        `[data-testid="${fp.parentTestId}"]`
      ) as HTMLElement | null) || (shadowRoot as unknown as ParentNode)
    : (shadowRoot as unknown as ParentNode);

  const candidates = Array.from(
    scope.querySelectorAll<HTMLElement>("button, a, [role='button']")
  );

  const score = (el: HTMLElement) => {
    let s = 0;
    if (el.tagName.toLowerCase() === fp.tagName) s += 3;
    if (el.getAttribute("role") === fp.role) s += 2;
    const dt = el.getAttribute("data-testid");
    if (fp.dataTestId && dt === fp.dataTestId) s += 5;
    const tokens = new Set(getStableClassTokens(el));
    for (const t of fp.classTokens) if (tokens.has(t)) s += 1;
    if (
      fp.siblingIndex != null &&
      el.parentElement &&
      el.parentElement.getAttribute("data-testid") === fp.parentTestId
    ) {
      const idx = Array.from(el.parentElement.children).indexOf(el);
      if (idx === fp.siblingIndex) s += 2;
    }
    // Prefer visible elements
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) s += 1;
    return s;
  };

  let best: HTMLElement | null = null;
  let bestScore = -1;
  for (const el of candidates) {
    const s = score(el);
    if (s > bestScore) {
      best = el;
      bestScore = s;
    }
  }
  return best;
}

function findByLayoutHeuristic(shadowRoot: ShadowRoot): HTMLElement | null {
  const all = Array.from(
    shadowRoot.querySelectorAll<HTMLElement>("button, a, [role='button']")
  );
  const visible = all.filter((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none"
    );
  });

  // Group by row (same top within a small epsilon)
  const epsilon = 8; // px
  const rows: Map<number, HTMLElement[]> = new Map();
  for (const el of visible) {
    const top = Math.round(el.getBoundingClientRect().top / epsilon) * epsilon;
    const arr = rows.get(top) || [];
    arr.push(el);
    rows.set(top, arr);
  }

  // Choose the top-most row that has at least 2 buttons (e.g., [Deposit, Send])
  const sortedTops = Array.from(rows.keys()).sort((a, b) => a - b);
  for (const top of sortedTops) {
    const row = rows.get(top)!;
    if (row.length >= 2) {
      // Return the left-most button in that row
      row.sort(
        (a, b) =>
          a.getBoundingClientRect().left - b.getBoundingClientRect().left
      );
      return row[0];
    }
  }
  return null;
}

export default function ExternalInlineClaim() {
  const { hostEl } = useShadowDom();
  const [depositClass, setDepositClass] = useState("");
  const [originalButtonHidden, setOriginalButtonHidden] = useState(false);
  const fingerprintRef = useRef<AnchorFingerprint | null>(null);

  const mount = useShadowAnchor({
    hostRef: { current: hostEl } as any,
    mountTestId: "external-mint-inline-mount",
    position: "before",
    anchorFinder: (shadowRoot) => {
      // Only inject on the profile tab - check for profile-specific elements
      const hasProfileElements =
        shadowRoot.querySelector('[data-testid*="profile"]') ||
        shadowRoot.textContent?.includes("Total balance");

      if (!hasProfileElements) return null;

      // 1) Try using previously learned fingerprint (stable, non-hardcoded)
      if (fingerprintRef.current) {
        const found = findByFingerprint(shadowRoot, fingerprintRef.current);
        if (found) return found;
      }
      // 2) Fallback: generic layout heuristic (left-most button in first row with ≥2 buttons)
      return findByLayoutHeuristic(shadowRoot);
    },
    onAnchorFound: (anchor) => {
      setDepositClass(anchor.className || "");
      // Only hide the original button if we haven't already hidden it
      if (!originalButtonHidden) {
        anchor.style.display = "none";
        setOriginalButtonHidden(true);
      }
      // Learn a reusable fingerprint for robust future detection
      fingerprintRef.current = fingerprintFromAnchor(anchor);
    },
  });

  // The useShadowAnchor hook now handles automatic restoration when the mount is removed

  if (!mount) return null;
  return createPortal(<MintTokens className={depositClass} />, mount);
}
