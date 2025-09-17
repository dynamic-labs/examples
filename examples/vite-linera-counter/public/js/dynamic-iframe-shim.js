(() => {
  const matchesAuthHost = (url) => {
    try {
      const u = new URL(url, document.baseURI);
      return u.hostname === "relay.dynamicauth.com" || /\.dynamicauth\.com$/.test(u.hostname);
    } catch {
      return false;
    }
  };

  const markCredentialless = (iframe) => {
    try {
      iframe.credentialless = true;
    } catch { }
  };

  // Intercept direct assignments to iframe.src
  try {
    const desc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "src");
    if (desc && desc.set) {
      const originalSet = desc.set;
      Object.defineProperty(HTMLIFrameElement.prototype, "src", {
        configurable: true,
        enumerable: desc.enumerable,
        get: desc.get,
        set(value) {
          if (matchesAuthHost(value)) markCredentialless(this);
          return originalSet.call(this, value);
        },
      });
    }
  } catch { }

  // Intercept setAttribute('src', ...)
  try {
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (
        this instanceof HTMLIFrameElement &&
        name &&
        name.toLowerCase() === "src" &&
        matchesAuthHost(value)
      ) {
        markCredentialless(this);
      }
      return originalSetAttribute.call(this, name, value);
    };
  } catch { }

  // Fallback: observe added iframes and src attribute changes
  try {
    const checkAndMark = (iframe) => {
      const value = iframe.getAttribute("src") || iframe.src;
      if (value && matchesAuthHost(value)) markCredentialless(iframe);
    };
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          for (const node of m.addedNodes) {
            if (node instanceof HTMLIFrameElement) {
              checkAndMark(node);
            } else if (node && node.querySelectorAll) {
              node.querySelectorAll("iframe").forEach(checkAndMark);
            }
          }
        } else if (
          m.type === "attributes" &&
          m.target instanceof HTMLIFrameElement &&
          m.attributeName === "src"
        ) {
          checkAndMark(m.target);
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
  } catch { }
})();
