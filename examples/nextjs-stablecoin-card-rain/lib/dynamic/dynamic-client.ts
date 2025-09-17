export interface DynamicClientOptions {
  baseUrl?: string;
  environmentId?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export class DynamicClient {
  private readonly baseUrl: string;
  private readonly environmentId: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options?: DynamicClientOptions) {
    const configuredBaseUrl =
      options?.baseUrl || "https://app.dynamicauth.com/api/v0/environments";
    this.environmentId =
      options?.environmentId || process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID || "";
    this.baseUrl = `${configuredBaseUrl.replace(/\/$/, "")}`;
    this.apiKey = options?.apiKey || process.env.DYNAMIC_API_KEY;
    this.fetchImpl = options?.fetchImpl || fetch;
  }

  async request<TResponse>(
    path: string,
    init?: RequestInit
  ): Promise<TResponse> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${this.baseUrl}/${this.environmentId}${normalizedPath}`;

    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };

    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await this.fetchImpl(url, {
      ...init,
      headers,
      cache: "no-store",
    });

    const payload = await res.json();

    if (!res.ok) {
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as any).message)
          : `Dynamic request failed with status ${res.status}`;
      const err: any = new Error(message);
      err.status = res.status;
      err.details = payload;
      throw err;
    }

    return payload as TResponse;
  }

  post<TRequest, TResponse>(path: string, body: TRequest): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put<TRequest, TResponse>(path: string, body: TRequest): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
}

export const dynamicClient = new DynamicClient();
