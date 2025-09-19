/**
 * Execute a function exclusively across tabs. Uses Web Locks API if available,
 * otherwise a localStorage fallback.
 * @template T
 * @param {() => Promise<T> | T} fn
 * @returns {Promise<T|undefined>}
 */
export const runOnceAcrossTabs = async (fn) => {
  if (typeof window === 'undefined') return undefined;

  const KEY = 'dynamic-auth-bridge-lock';
  const NAME = 'dynamic-auth-bridge';
  const hasLocks = typeof navigator !== 'undefined' && navigator && navigator.locks && typeof navigator.locks.request === 'function';
  if (hasLocks) {
    return navigator.locks.request(NAME, fn);
  }

  if (localStorage.getItem(KEY)) return undefined;
  try {
    localStorage.setItem(KEY, String(Date.now()));
    return await fn();
  } finally {
    localStorage.removeItem(KEY);
  }
};