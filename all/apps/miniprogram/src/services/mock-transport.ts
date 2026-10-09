import { words, lessons, candidates } from "../data/demo";
import type {
  RequestOptions,
  TransportResponse,
} from "../domain/request-client";
import { readPreviewSettings } from "./preview-settings";
export async function mockTransport(
  options: RequestOptions,
): Promise<TransportResponse> {
  const settings = readPreviewSettings();
  await new Promise((resolve) =>
    setTimeout(resolve, settings.scenario === "slow" ? 2500 : 300),
  );
  if (settings.scenario === "error")
    return {
      statusCode: 503,
      data: {
        error: {
          code: "DEMO_UNAVAILABLE",
          message: "内容暂时加载失败，请重试",
          requestId: "local-demo",
        },
      },
    };
  let payload: unknown;
  // [PRE-LAUNCH:PL-02][CONTRACT:C-02/C-03] Mock 仅模拟契约；生产从数据库返回记录，详情不能再查询内置样本。
  if (options.path.startsWith("/api/public/words/")) {
    const found =
      settings.scenario === "empty"
        ? undefined
        : words.find(
            (word) =>
              word.id ===
              decodeURIComponent(options.path.split("/").pop() || ""),
          );
    return found
      ? { statusCode: 200, data: { data: found } }
      : {
          statusCode: 404,
          data: { error: { code: "NOT_FOUND", message: "没有找到词条" } },
        };
  }
  if (options.path.startsWith("/api/public/candidates/")) {
    const found =
      settings.scenario === "empty"
        ? undefined
        : candidates.find(
            (candidate) =>
              candidate.id ===
              decodeURIComponent(options.path.split("/").pop() || ""),
          );
    return found
      ? { statusCode: 200, data: { data: found } }
      : {
          statusCode: 404,
          data: { error: { code: "NOT_FOUND", message: "没有找到选手" } },
        };
  }
  switch (options.path) {
    case "/api/public/home":
      payload =
        settings.scenario === "empty"
          ? null
          : {
              title: settings.title,
              subtitle: settings.subtitle,
              banner:
                settings.banner === "none"
                  ? null
                  : {
                      id: settings.banner,
                      url: `/assets/questions/${settings.banner}.png`,
                    },
            };
      break;
    case "/api/public/learning":
      payload =
        settings.scenario === "empty"
          ? { words: [], lessons: [] }
          : { words, lessons };
      break;
    case "/api/public/voting":
      payload =
        settings.scenario === "empty"
          ? { title: "语言大赛", candidates: [] }
          : { title: "用声音，连接你我。", candidates };
      break;
    default:
      return {
        statusCode: 404,
        data: { error: { code: "NOT_FOUND", message: "没有找到对应内容" } },
      };
  }
  return {
    statusCode: 200,
    data: { data: JSON.parse(JSON.stringify(payload)) },
  };
}
