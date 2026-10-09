import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaClient, type ImageAsset as AssetRow } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  decodeHomeConfig,
  type HomeConfig,
  type ImageAsset,
} from "../../../shared/contracts.js";
import type { ServerConfig } from "./config.js";
import { ObjectStorage } from "./storage.js";
import { verifyPassword } from "./password.js";
import { normalizeImage } from "./image.js";
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export class PlatformService {
  readonly db: PrismaClient;
  private storage: ObjectStorage;
  private attempts = new Map<string, { count: number; expires: number }>();
  private timer?: NodeJS.Timeout;
  constructor(readonly config: ServerConfig) {
    this.db = new PrismaClient({
      datasources: { db: { url: config.databaseUrl } },
    });
    this.storage = new ObjectStorage(config);
  }
  async onModuleInit() {
    await this.db.$connect();
    this.timer = setInterval(
      () =>
        void this.cleanObjects().catch(() => console.error("对象清理重试失败")),
      30000,
    );
    this.timer.unref();
  }
  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.db.$disconnect();
    this.storage.close();
  }
  async login(body: unknown, ip: string) {
    const input = body as { username?: unknown; password?: unknown };
    if (
      !input ||
      typeof input.username !== "string" ||
      typeof input.password !== "string" ||
      input.username.length > 100 ||
      input.password.length > 1024
    )
      throw new BadRequestException("请输入有效账号密码");
    const username = input.username.trim(),
      now = Date.now();
    // [PRE-LAUNCH:PL-01] 当前单进程基础登录限速；多副本部署时必须使用共享限速器，与反向代理配置共同验收。
    const key = ip + ":" + username,
      previous = this.attempts.get(key);
    if (previous && previous.expires > now && previous.count >= 10)
      throw new HttpException("尝试次数过多，请稍后再试", 429);
    for (const [k, v] of this.attempts)
      if (v.expires <= now) this.attempts.delete(k);
    if (this.attempts.size >= 10000 && !this.attempts.has(key))
      throw new HttpException("登录繁忙，请稍后重试", 429);
    this.attempts.set(key, {
      count: previous && previous.expires > now ? previous.count + 1 : 1,
      expires:
        previous && previous.expires > now ? previous.expires : now + 600000,
    });
    const administrator = await this.db.administrator.findUnique({
      where: { username },
    });
    const dummy = "scrypt:00000000000000000000000000000000:" + "0".repeat(128);
    if (
      !(await verifyPassword(
        input.password,
        administrator?.passwordHash || dummy,
      )) ||
      !administrator
    )
      throw new UnauthorizedException("账号或密码不正确");
    this.attempts.delete(key);
    await this.db.session.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    const token = randomBytes(32).toString("hex");
    await this.db.session.create({
      data: {
        tokenHash: hash(token),
        administratorId: administrator.id,
        expiresAt: new Date(now + 8 * 3600000),
      },
    });
    return { token, identity: { username } };
  }
  async identity(token: unknown) {
    if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token))
      throw new UnauthorizedException("请先登录");
    const session = await this.db.session.findUnique({
      where: { tokenHash: hash(token) },
      include: { administrator: true },
    });
    if (!session || session.expiresAt.getTime() <= Date.now())
      throw new UnauthorizedException("登录已失效");
    return { username: session.administrator.username };
  }
  async logout(token: unknown) {
    if (typeof token === "string")
      await this.db.session.deleteMany({ where: { tokenHash: hash(token) } });
  }
  private asset(row: AssetRow): ImageAsset {
    return {
      id: row.id,
      name: row.name,
      mime: row.mime,
      size: row.size,
      createdAt: row.createdAt.toISOString(),
      url: "/api/admin/assets/" + row.id + "/content",
    };
  }
  async assets() {
    return {
      items: (
        await this.db.imageAsset.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        })
      ).map((x) => this.asset(x)),
    };
  }
  async upload(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("请选择图片文件");
    let normalized: Awaited<ReturnType<typeof normalizeImage>>;
    try {
      normalized = await normalizeImage(file.buffer);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    const id = randomUUID(),
      objectKey = "images/" + id + ".png";
    await this.storage.put(objectKey, normalized.bytes, normalized.mime);
    try {
      const row = await this.db.imageAsset.create({
        data: {
          id,
          objectKey,
          name:
            file.originalname.replace(/[\x00-\x1f\\/]/g, "_").slice(0, 120) ||
            "image.png",
          mime: normalized.mime,
          size: normalized.bytes.length,
        },
      });
      return this.asset(row);
    } catch (error) {
      // [PRE-LAUNCH:PL-04] 对象写入成功、数据库失败且清理也失败时，需正式存储侧孤立对象审计；不能把此回滚当成跨系统原子事务。
      await this.storage
        .delete(objectKey)
        .catch(() => console.error("上传回滚存储清理失败：" + id));
      throw error;
    }
  }
  async home(): Promise<HomeConfig | null> {
    const row = await this.db.homeConfig.findUnique({ where: { id: "home" } });
    return row
      ? {
          title: row.title,
          subtitle: row.subtitle,
          bannerAssetId: row.bannerAssetId,
        }
      : null;
  }
  async saveHome(body: unknown) {
    let config: HomeConfig;
    try {
      config = decodeHomeConfig(body);
    } catch {
      throw new BadRequestException("首页配置格式错误");
    }
    config.title = config.title.trim();
    config.subtitle = config.subtitle.trim();
    if (
      !config.title ||
      config.title.length > 60 ||
      config.subtitle.length > 150 ||
      (config.bannerAssetId !== null &&
        (!config.bannerAssetId || config.bannerAssetId.length > 100))
    )
      throw new BadRequestException("首页标题、介绍或图片引用不合法");
    // [CONTRACT:C-02] 和删除图片共用事务锁；数据库外键阻断失效引用。今后扩展题目/课程引用时必须一起扩展检查。
    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(261009,1)`;
      if (
        config.bannerAssetId &&
        !(await tx.imageAsset.findUnique({
          where: { id: config.bannerAssetId },
        }))
      )
        throw new BadRequestException("图片已不存在，请重新选择");
      await tx.homeConfig.upsert({
        where: { id: "home" },
        create: { id: "home", ...config },
        update: config,
      });
    });
    return config;
  }
  async publicHome() {
    const row = await this.db.homeConfig.findUnique({
      where: { id: "home" },
      include: { banner: true },
    });
    return row
      ? {
          title: row.title,
          subtitle: row.subtitle,
          banner: row.banner
            ? {
                id: row.banner.id,
                url:
                  this.config.publicBaseUrl +
                  "/api/public/assets/" +
                  row.banner.id +
                  "/content",
              }
            : null,
        }
      : null;
  }
  async content(id: string, isPublic: boolean) {
    const row = await this.db.imageAsset.findUnique({
      where: { id },
      include: { home: true },
    });
    if (!row || (isPublic && !row.home))
      throw new NotFoundException("图片不存在");
    return { bytes: await this.storage.get(row.objectKey), mime: row.mime };
  }
  async remove(id: string) {
    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(261009,1)`;
      const row = await tx.imageAsset.findUnique({
        where: { id },
        include: { home: true },
      });
      if (!row) throw new NotFoundException("图片不存在");
      if (row.home)
        throw new ConflictException("图片仍被首页引用，请先更换首页图片");
      await tx.objectDeletion.create({ data: { objectKey: row.objectKey } });
      await tx.imageAsset.delete({ where: { id } });
    });
    // 删除失败保留数据库清理队列，重启/定时再次处理，不能用失败重试恢复已删除的公开引用。
    await this.cleanObjects().catch(() => console.error("图片对象待重试清理"));
    return { deleted: true };
  }
  private async cleanObjects() {
    for (const row of await this.db.objectDeletion.findMany({ take: 100 })) {
      await this.storage.delete(row.objectKey);
      await this.db.objectDeletion.deleteMany({
        where: { objectKey: row.objectKey },
      });
    }
  }
  async ready() {
    try {
      await this.db.homeConfig.findUnique({
        where: { id: "home" },
        select: { id: true },
      });
      await this.db.administrator.count();
      await this.db.session.count();
      await this.db.imageAsset.count();
      await this.db.objectDeletion.count();
      await this.storage.ready();
      return { status: "ready" };
    } catch {
      throw new ServiceUnavailableException("数据库结构或图片存储尚未就绪");
    }
  }
}
