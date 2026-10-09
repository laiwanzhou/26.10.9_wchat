import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { PlatformService } from "./platform.js";
export class AdminGuard implements CanActivate {
  constructor(@Inject(PlatformService) private service: PlatformService) {}
  async canActivate(context: ExecutionContext) {
    await this.service.identity(
      context.switchToHttp().getRequest().cookies?.yanxi_session,
    );
    return true;
  }
}
@Controller("api/admin/auth")
export class AuthController {
  constructor(@Inject(PlatformService) private service: PlatformService) {}
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.login(body, req.ip || "unknown");
    res.cookie("yanxi_session", result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.service.config.cookieSecure,
      path: "/api/admin",
      maxAge: 8 * 3600000,
    });
    return { data: result.identity };
  }
  @Get("me")
  @UseGuards(AdminGuard)
  async me(@Req() req: Request) {
    return { data: await this.service.identity(req.cookies?.yanxi_session) };
  }
  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.service.logout(req.cookies?.yanxi_session);
    res.clearCookie("yanxi_session", {
      httpOnly: true,
      sameSite: "lax",
      secure: this.service.config.cookieSecure,
      path: "/api/admin",
    });
    return { data: { signedOut: true } };
  }
}
@Controller("api/admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(PlatformService) private service: PlatformService) {}
  @Get("home") async home() {
    return { data: await this.service.home() };
  }
  @Put("home") async save(@Body() body: unknown) {
    return { data: await this.service.saveHome(body) };
  }
  @Get("assets") async assets() {
    return { data: await this.service.assets() };
  }
  @Post("assets")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    return { data: await this.service.upload(file) };
  }
  @Delete("assets/:id") async remove(@Param("id") id: string) {
    return { data: await this.service.remove(id) };
  }
  @Get("assets/:id/content") async content(
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const image = await this.service.content(id, false);
    res
      .set({ "Content-Type": image.mime, "Cache-Control": "private, no-store" })
      .send(image.bytes);
  }
}
@Controller("api/public")
export class PublicController {
  constructor(@Inject(PlatformService) private service: PlatformService) {}
  @Get("home") async home() {
    return { data: await this.service.publicHome() };
  }
  @Get("assets/:id/content") async content(
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const image = await this.service.content(id, true);
    res
      .set({ "Content-Type": image.mime, "Cache-Control": "no-store" })
      .send(image.bytes);
  }
}
@Controller("api/health")
export class HealthController {
  constructor(@Inject(PlatformService) private service: PlatformService) {}
  @Get("live") live() {
    return { data: { status: "live" } };
  }
  @Get("ready") async ready() {
    return { data: await this.service.ready() };
  }
}
