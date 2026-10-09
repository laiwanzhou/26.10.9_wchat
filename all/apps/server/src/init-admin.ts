import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { hashPassword } from "./password.js";
export async function initializeAdmin(
  databaseUrl: string,
  username: string,
  password: string,
) {
  if (
    !/^[a-zA-Z0-9_.-]{3,64}$/.test(username) ||
    password.length < 12 ||
    password.length > 1024
  )
    throw Error("管理员账号需 3–64 位，密码至少 12 位");
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    // 幂等创建；不得因服务重启或重复初始化覆盖既有密码。
    await db.administrator.upsert({
      where: { username },
      create: { username, passwordHash: await hashPassword(password) },
      update: {},
    });
  } finally {
    await db.$disconnect();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (!DATABASE_URL || !ADMIN_USERNAME || !ADMIN_PASSWORD)
    throw Error("缺少管理员初始化环境配置");
  await initializeAdmin(DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD);
  console.log("管理员已初始化（不会覆盖已有密码）");
}
