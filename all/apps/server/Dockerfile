# [PRE-LAUNCH:PL-05] 正式服务器镜像构建、HTTPS、备份和回退必须另行实测。
FROM node:22.18.0-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.14.0
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter server build
ENV VITE_ADMIN_MODE=service
RUN pnpm --filter admin build

FROM node:22.18.0-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.14.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/miniprogram/package.json ./apps/miniprogram/package.json
COPY apps/server/prisma ./apps/server/prisma
RUN pnpm install --prod --frozen-lockfile && pnpm --filter server generate
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/admin/dist ./apps/admin/dist
ENV NODE_ENV=production SERVE_ADMIN=true PORT=3000
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s CMD node -e "fetch('http://127.0.0.1:3000/api/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/server/dist/apps/server/src/main.js"]
