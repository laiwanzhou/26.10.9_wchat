import "reflect-metadata";
import {
  Catch,
  HttpException,
  Module,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  json,
  static as staticFiles,
  type Request,
  type Response,
} from "express";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { readConfig } from "./config.js";
import { PlatformService } from "./platform.js";
import {
  AdminController,
  AdminGuard,
  AuthController,
  PublicController,
  HealthController,
} from "./controllers.js";
@Catch()
class Errors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>(),
      req = host.switchToHttp().getRequest<Request>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    // [CONTRACT:C-04] 全部错误具有服务端 requestId；内部异常不返回数据库/凭证/对象存储细节。
    const message =
      error instanceof HttpException
        ? error.message
        : "服务暂时不可用，请稍后重试";
    if (status >= 500) console.error("服务错误：" + res.locals.requestId);
    res
      .status(status)
      .json({
        error: {
          code: "HTTP_" + status,
          message,
          requestId: res.locals.requestId || randomUUID(),
        },
      });
  }
}
export async function createApp(env: NodeJS.ProcessEnv = process.env) {
  const config = readConfig(env),
    service = new PlatformService(config);
  @Module({
    controllers: [
      AuthController,
      AdminController,
      PublicController,
      HealthController,
    ],
    providers: [{ provide: PlatformService, useValue: service }, AdminGuard],
  })
  class AppModule {}
  const app = await NestFactory.create(AppModule, {
    logger: false,
    bodyParser: false,
  });
  app.use((req: Request, res: Response, next: () => void) => {
    res.locals.requestId = randomUUID();
    res.setHeader("X-Request-Id", res.locals.requestId);
    next();
  });
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.enableCors({ origin: config.adminOrigin, credentials: true });
  app.use((req: Request, res: Response, next: () => void) => {
    if (
      req.path.startsWith("/api/admin") &&
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin !== config.adminOrigin
    ) {
      res
        .status(403)
        .json({
          error: {
            code: "CSRF_ORIGIN",
            message: "请求来源不允许",
            requestId: res.locals.requestId,
          },
        });
      return;
    }
    next();
  });
  app.use(cookieParser());
  app.use(json({ limit: "64kb" }));
  app.useGlobalFilters(new Errors());
  if (env.SERVE_ADMIN === "true")
    app.use(
      staticFiles(
        fileURLToPath(new URL("../../../../../admin/dist/", import.meta.url)),
      ),
    );
  // [PRE-LAUNCH:PL-05] 明确公开地址及受控代理；当前不信任 X-Forwarded-For。正式代理/HTTPS/微信域名另行验收。
  await app.init();
  return app;
}
