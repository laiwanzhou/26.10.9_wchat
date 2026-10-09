import type { ApiError } from "../contracts/generated";
// [CONTRACT:C-04] 包装字段来源 shared/contracts；真实 server 错误码、HTTP 状态和 requestId 与这里同改。
export interface RequestOptions {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: unknown;
  headers?: Record<string, string>;
}
export interface TransportResponse {
  statusCode: number;
  data: unknown;
}
export type RequestTransport = (
  options: RequestOptions,
) => Promise<TransportResponse>;
export class RequestError extends Error {
  code: string;
  statusCode?: number;
  requestId?: string;
  constructor(
    code: string,
    message: string,
    statusCode?: number,
    requestId?: string,
  ) {
    super(message);
    this.name = "RequestError";
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}
interface ResponseEnvelope {
  data?: unknown;
  error?: Partial<ApiError>;
}
export function createRequestClient(
  transport: RequestTransport,
  timeoutMs = 10000,
) {
  return async function request<T>(options: RequestOptions): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        Promise.resolve().then(() => transport(options)),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(new RequestError("REQUEST_TIMEOUT", "请求超时，请重试")),
            timeoutMs,
          );
        }),
      ]);
      const body =
        response.data && typeof response.data === "object"
          ? (response.data as ResponseEnvelope)
          : null;
      if (
        response.statusCode < 200 ||
        response.statusCode >= 300 ||
        body?.error
      ) {
        throw new RequestError(
          body?.error?.code || `HTTP_${response.statusCode}`,
          body?.error?.message || "服务暂不可用，请稍后重试",
          response.statusCode,
          body?.error?.requestId,
        );
      }
      if (
        !body ||
        !Object.prototype.hasOwnProperty.call(body, "data") ||
        body.data === undefined
      )
        throw new RequestError(
          "INVALID_RESPONSE",
          "内容格式异常，请稍后重试",
          response.statusCode,
        );
      return body.data as T;
    } catch (error) {
      if (error instanceof RequestError) throw error;
      throw new RequestError("NETWORK_ERROR", "网络连接失败，请稍后重试");
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  };
}
