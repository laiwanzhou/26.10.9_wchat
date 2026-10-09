import {
  createRequestClient,
  RequestError,
  type RequestOptions,
  type TransportResponse,
} from "../domain/request-client";
import { frontendConfig } from "../config/env";
import { mockTransport } from "./mock-transport";
function httpTransport(options: RequestOptions): Promise<TransportResponse> {
  // [CONTRACT:C-04] 与共享 DTO、Mock 包装及后端错误码同改；公开接口不携带管理员 Cookie/密钥。
  if (!frontendConfig.apiBaseUrl)
    return Promise.reject(
      new RequestError("API_NOT_CONFIGURED", "后端地址尚未配置"),
    );
  return new Promise((resolve, reject) => {
    wx.request({
      url: frontendConfig.apiBaseUrl.replace(/\/$/, "") + options.path,
      method: options.method || "GET",
      data: options.data as WechatMiniprogram.RequestOption["data"],
      header: options.headers,
      timeout: frontendConfig.timeoutMs,
      success: (response) =>
        resolve({ statusCode: response.statusCode, data: response.data }),
      fail: (error) =>
        reject(
          new RequestError(
            error.errMsg.includes("timeout")
              ? "REQUEST_TIMEOUT"
              : "NETWORK_ERROR",
            error.errMsg.includes("timeout")
              ? "请求超时，请重试"
              : "网络连接失败，请稍后重试",
          ),
        ),
    });
  });
}
export const request = createRequestClient(
  (options) =>
    frontendConfig.mode === "mock"
      ? mockTransport(options)
      : httpTransport(options),
  frontendConfig.timeoutMs,
);
export { RequestError };
