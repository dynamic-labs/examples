export interface RainClientOptions {
  baseUrl?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export class RainClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options?: RainClientOptions) {
    const configuredBaseUrl =
      options?.baseUrl ||
      process.env.RAIN_API_BASE_URL ||
      "https://api-dev.raincards.xyz";
    this.baseUrl = configuredBaseUrl.replace(/\/$/, "");
    this.apiKey = options?.apiKey || process.env.RAIN_API_KEY;
    this.fetchImpl = options?.fetchImpl || fetch.bind(globalThis);
  }

  async request<TResponse>(
    path: string,
    init?: RequestInit
  ): Promise<TResponse> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${this.baseUrl}${normalizedPath}`;

    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };

    if (this.apiKey) headers["Api-Key"] = this.apiKey;
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await this.fetchImpl(url, {
      ...init,
      headers,
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        isJson && payload && typeof payload === "object" && "message" in payload
          ? String((payload as any).message)
          : `Rain request failed with status ${res.status}`;
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

  get<TResponse>(
    path: string,
    headers?: Record<string, string>
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: "GET",
      headers,
    });
  }
}

export const rainClient = new RainClient();
