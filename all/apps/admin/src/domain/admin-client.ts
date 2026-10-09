export class AdminApiError extends Error {
  status: number;
  requestId?: string;
  constructor(status: number, message: string, requestId?: string) {
    super(message);
    this.status = status;
    this.requestId = requestId;
  }
}
export function createAdminClient(transport: typeof fetch, base = "") {
  return async (
    path: string,
    options: { method?: string; body?: unknown } = {},
  ) => {
    const headers: Record<string, string> = {};
    const multipart = options.body instanceof FormData;
    if (options.body && !multipart)
      headers["Content-Type"] = "application/json";
    let response: Response;
    try {
      response = await transport(base.replace(/\/$/, "") + path, {
        method: options.method || "GET",
        credentials: "include",
        headers,
        signal: AbortSignal.timeout(15000),
        body: multipart
          ? (options.body as FormData)
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
      });
    } catch {
      throw new AdminApiError(0, "无法连接服务，请检查服务是否启动后重试");
    }
    let body: {
      data?: unknown;
      error?: { message?: string; requestId?: string };
    };
    try {
      body = await response.json();
    } catch {
      throw new AdminApiError(response.status, "服务响应格式异常");
    }
    if (!response.ok)
      throw new AdminApiError(
        response.status,
        body?.error?.message || "请求失败",
        body?.error?.requestId,
      );
    if (
      !body ||
      typeof body !== "object" ||
      !Object.prototype.hasOwnProperty.call(body, "data") ||
      body.error
    )
      throw new AdminApiError(response.status, "服务响应格式异常");
    return body.data;
  };
}
