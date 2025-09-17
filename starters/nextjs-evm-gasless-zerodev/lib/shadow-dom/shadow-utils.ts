export function queryFirst<T extends Element>(
  root: ParentNode,
  selectors: string[]
): T | null {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el) return el as T;
  }
  return null;
}

export function getShadowHosts(container: HTMLElement): HTMLElement[] {
  return [
    ...Array.from(container.querySelectorAll('[data-testid$="-shadow"]')),
    ...Array.from(
      container.querySelectorAll(".dynamic-shadow-dom.embedded-widget")
    ),
  ] as HTMLElement[];
}

// Check if an element is still connected to its shadow root
export function isElementInShadowRoot(element: HTMLElement): boolean {
  let current = element;
  while (current.parentElement) {
    current = current.parentElement;
  }
  // If we reach the document, the element is not in a shadow root
  if (current === document.documentElement || current === document.body) {
    return false;
  }
  // If the root is a shadow root, the element is in a shadow root
  return current.parentNode instanceof ShadowRoot;
}

export type InsertPosition = "before" | "after" | "append" | "prepend";

export function insertRelative(
  anchor: HTMLElement,
  mount: HTMLElement,
  position: InsertPosition
) {
  if (position === "before") {
    anchor.parentElement?.insertBefore(mount, anchor);
  } else if (position === "after") {
    anchor.insertAdjacentElement("afterend", mount);
  } else if (position === "append") {
    anchor.appendChild(mount);
  } else if (position === "prepend") {
    anchor.prepend(mount);
  }
}

// Clone global styles into a shadow root so Tailwind/utilities apply inside it.
// We clone both <link rel="stylesheet"> and <style> tags from the main document.
export function injectGlobalStylesIntoShadow(shadowRoot: ShadowRoot) {
  const markerAttr = "data-shadow-global-styles";
  if (shadowRoot.querySelector(`[${markerAttr}]`)) return;

  const head = document.head || document.documentElement;
  const toClone = [
    ...Array.from(
      head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')
    ),
    ...Array.from(head.querySelectorAll<HTMLStyleElement>("style")),
  ];

  const fragment = document.createDocumentFragment();
  for (const el of toClone) {
    if (el.tagName.toLowerCase() === "link") {
      const src = el as HTMLLinkElement;
      const link = document.createElement("link");
      for (const attr of Array.from(src.attributes))
        link.setAttribute(attr.name, attr.value);
      fragment.appendChild(link);
    } else if (el.tagName.toLowerCase() === "style") {
      const src = el as HTMLStyleElement;
      const style = document.createElement("style");
      // Preserve relevant attributes (nonce/media/data-*) to keep CSP and media queries working
      for (const attr of Array.from(src.attributes)) {
        if (
          attr.name === "nonce" ||
          attr.name === "media" ||
          attr.name.startsWith("data-")
        ) {
          style.setAttribute(attr.name, attr.value);
        }
      }
      style.textContent = src.textContent || "";
      fragment.appendChild(style);
    }
  }

  const marker = document.createElement("style");
  marker.setAttribute(markerAttr, "true");
  fragment.appendChild(marker);
  shadowRoot.appendChild(fragment);
}

// Create an isolated inner shadow root under the provided container element and
// inject global styles into it. Returns the element to portal React children into.
export function createIsolatedStyledShadowMount(container: HTMLElement): {
  host: HTMLElement;
  mount: HTMLElement;
} {
  const host = document.createElement("div");
  host.style.display = "contents";
  const innerShadow = host.attachShadow({ mode: "open" });
  injectGlobalStylesIntoShadow(innerShadow);

  // Mirror the top-level theme class (e.g., 'dark') so variant selectors work
  const themeWrapper = document.createElement("div");
  const mirrorTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) themeWrapper.classList.add("dark");
    else themeWrapper.classList.remove("dark");
  };
  mirrorTheme();
  const mo = new MutationObserver(mirrorTheme);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  const mount = document.createElement("div");
  mount.setAttribute("data-shadow-tab-mount", "true");
  themeWrapper.appendChild(mount);
  innerShadow.appendChild(themeWrapper);
  container.appendChild(host);
  return { host, mount };
}
