import { dynamicClient, environmentId } from "./dynamic";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!BASE_URL) throw new Error("EXPO_PUBLIC_API_BASE_URL is required");

/**
 * Custom API Client Hook
 *
 * Provides an authenticated HTTP client for making requests to the backend API.
 * Automatically injects:
 * - Dynamic Labs JWT token from authenticated session
 * - Environment ID header for backend validation
 * - Proper content-type headers
 *
 * All requests are type-safe using TypeScript generics.
 *
 * @returns Object with HTTP method functions (get, post, put, delete)
 *
 * @example
 * const apiClient = useApiClient();
 * const data = await apiClient.get<UserData>('/user/profile');
 *
 * @example
 * const apiClient = useApiClient();
 * const result = await apiClient.post<{ data: OnrampOrderResponse }>('/coinbase/onramp', {
 *   destinationAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   destinationNetwork: 'base',
 *   paymentCurrency: 'USD',
 *   paymentAmount: '100',
 *   purchaseCurrency: 'USDC',
 *   purchaseAmount: '100',
 *   agreementAcceptedAt: new Date().toISOString(),
 *   isQuote: false,
 *   isSandbox: true
 * });
 */
export function useApiClient() {
  /**
   * Internal request method that handles all HTTP requests
   *
   * @param endpoint - API endpoint path (e.g., '/coinbase/onramp')
   * @param options - Fetch API options (method, body, headers, etc.)
   * @returns Typed response data
   * @throws Error if request fails or returns non-2xx status
   */
  const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    try {
      console.info(
        `[useApiClient.request]: ${
          options.method || "GET"
        } ${BASE_URL}${endpoint}`
      );

      // Get JWT token from Dynamic
      const authToken = dynamicClient.auth.token;
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Dynamic-Environment-Id": environmentId,
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[useApiClient.request]: Error ${response.status}`,
          errorText
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseJson = await response.json();
      console.info(`[useApiClient.request]: Response Success`);

      return responseJson;
    } catch (error) {
      console.error("[useApiClient.request]: Request Failed:", error);
      throw error;
    }
  };

  const get = <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" });

  const post = <T>(endpoint: string, data: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });

  const put = <T>(endpoint: string, data: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });

  const del = <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" });

  return {
    request,
    get,
    post,
    put,
    delete: del,
  };
}
