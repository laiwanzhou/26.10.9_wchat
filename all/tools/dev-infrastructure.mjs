// 仅本地开发／集成测试使用（Development/Test Only）；S3rver 不是生产对象存储。
import EmbeddedPostgres from "embedded-postgres";
import S3rver from "s3rver";
import { createServer } from "node:net";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
async function freePort() {
  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  await new Promise((r) => server.close(r));
  return port;
}
export async function startInfrastructure({
  directory,
  quiet = false,
  pgPort,
  s3Port,
} = {}) {
  directory = resolve(
    directory || join(import.meta.dirname, "../.runtime/development"),
  );
  await mkdir(directory, { recursive: true });
  const credentialPath = join(directory, "postgres-credential");
  let password;
  try {
    password = await readFile(credentialPath, "utf8");
  } catch {
    password = randomBytes(24).toString("hex");
    await writeFile(credentialPath, password, { mode: 0o600 });
  }
  pgPort = pgPort || (await freePort());
  s3Port = s3Port || (await freePort());
  const pg = new EmbeddedPostgres({
    databaseDir: join(directory, "postgres"),
    user: "postgres",
    password,
    port: pgPort,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    postgresFlags: ["-h", "127.0.0.1"],
    onLog: quiet ? () => {} : console.log,
    onError: console.error,
  });
  await pg.initialise();
  await pg.start();
  const objects = join(directory, "objects");
  await mkdir(objects, { recursive: true });
  const createS3 = () =>
    new S3rver({
      port: s3Port,
      address: "127.0.0.1",
      directory: objects,
      silent: true,
      configureBuckets: [{ name: "images" }],
    });
  let s3;
  try {
    s3 = createS3();
    await s3.run();
  } catch (error) {
    await pg.stop();
    throw error;
  }
  let running = true;
  return {
    env: {
      DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${pgPort}/postgres?connection_limit=5&connect_timeout=3`,
      S3_ENDPOINT: `http://127.0.0.1:${s3Port}`,
      S3_BUCKET: "images",
      S3_ACCESS_KEY: "S3RVER",
      S3_SECRET_KEY: "S3RVER",
    },
    async restart() {
      await s3.close();
      await pg.stop();
      await pg.start();
      s3 = createS3();
      await s3.run();
    },
    async stop() {
      if (running) {
        running = false;
        await s3.close();
        await pg.stop();
      }
    },
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const infra = await startInfrastructure({
    pgPort: 55432,
    s3Port: 59000,
    quiet: true,
  });
  const envPath = resolve(import.meta.dirname, "../.env");
  let previous = "";
  try {
    previous = await readFile(envPath, "utf8");
  } catch {}
  const retained = previous
    .split(/\r?\n/)
    .filter(
      (line) =>
        !Object.keys(infra.env).some((key) => line.startsWith(key + "=")),
    );
  const defaults = {
    PUBLIC_BASE_URL: "http://127.0.0.1:3000",
    ADMIN_ORIGIN: "http://127.0.0.1:5173",
    PORT: "3000",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: randomBytes(18).toString("base64url"),
    VITE_ADMIN_MODE: "service",
  };
  for (const [key, value] of Object.entries(defaults))
    if (!retained.some((line) => line.startsWith(key + "=")))
      retained.push(key + "=" + value);
  await writeFile(
    envPath,
    retained
      .filter(Boolean)
      .concat(
        Object.entries(infra.env).map(([key, value]) => key + "=" + value),
      )
      .join("\n") + "\n",
    { mode: 0o600 },
  );
  console.log(
    "本地 PostgreSQL/S3 测试服务已启动，配置保存在 all/.env；管理员密码仅在该文件中查看。按 Ctrl+C 停止。",
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, async () => {
      await infra.stop();
      process.exit(0);
    });
  await new Promise(() => {});
}
