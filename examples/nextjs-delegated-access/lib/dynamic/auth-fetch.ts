import { getAuthToken } from "@dynamic-labs/sdk-react-core";

/**
 * Error thrown when authentication is required but no token is available.
 */
export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required. Please log in.");
    this.name = "AuthRequiredError";
  }
}

/**
 * Makes an authenticated fetch request with the Dynamic auth token.
 *
 * Automatically adds the Authorization header with the Bearer token.
 * Throws AuthRequiredError if no auth token is available.
 *
 * @param url - The URL to fetch
 * @param options - Optional fetch options (method, body, etc.)
 * @returns The fetch Response
 * @throws AuthRequiredError if not authenticated
 */
export async function authFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = getAuthToken();

  if (!token) throw new AuthRequiredError();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
