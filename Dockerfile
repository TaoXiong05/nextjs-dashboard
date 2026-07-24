# ---------------------------------------------------
# 阶段 1：安装依赖 (deps)
# ---------------------------------------------------
FROM node:25-alpine AS deps
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------
# 阶段 2：编译构建 (builder)
# ---------------------------------------------------
FROM node:25-alpine AS builder
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 编译 Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---------------------------------------------------
# 阶段 3：生产运行 (runner) - 极简轻量镜像
# ---------------------------------------------------
FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建安全运行用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 仅复制必要产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]