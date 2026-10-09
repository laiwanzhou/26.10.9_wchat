export interface ServerConfig {
  databaseUrl: string;
  publicBaseUrl: string;
  adminOrigin: string;
  cookieSecure: boolean;
  port: number;
  s3Endpoint: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3Region: string;
}
export function readConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const required = (key: string) => {
    if (!env[key]?.trim()) throw Error("缺少配置：" + key);
    return env[key]!.trim();
  };
  const databaseUrl = required("DATABASE_URL");
  if (!/^postgres(ql)?:\/\//.test(databaseUrl))
    throw Error("DATABASE_URL 必须使用 PostgreSQL");
  const publicBase = new URL(required("PUBLIC_BASE_URL"));
  const origin = new URL(required("ADMIN_ORIGIN"));
  for (const url of [publicBase, origin]) {
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      throw Error("服务地址必须是完整 HTTP/HTTPS Origin");
    // [PRE-LAUNCH:PL-03/PL-05] 正式部署必须用 HTTPS 反向代理及对应微信合法域名；Cookie 不接受环境降级。
    if (env.NODE_ENV === "production" && url.protocol !== "https:")
      throw Error("生产地址必须使用 HTTPS");
  }
  const s3Endpoint = new URL(required("S3_ENDPOINT"));
  if (
    !["http:", "https:"].includes(s3Endpoint.protocol) ||
    s3Endpoint.username ||
    s3Endpoint.password
  )
    throw Error("S3_ENDPOINT 非法");
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("PORT 非法");
  return {
    databaseUrl,
    publicBaseUrl: publicBase.origin,
    adminOrigin: origin.origin,
    cookieSecure: env.NODE_ENV === "production",
    port,
    s3Endpoint: s3Endpoint.href,
    s3Bucket: required("S3_BUCKET"),
    s3AccessKey: required("S3_ACCESS_KEY"),
    s3SecretKey: required("S3_SECRET_KEY"),
    s3Region: env.S3_REGION || "us-east-1",
  };
}
