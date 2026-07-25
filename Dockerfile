# ---------------------------------------------------
# 阶段 1：安装依赖 (deps)
# ---------------------------------------------------
FROM node:25-alpine AS deps
# 💡 Node 25 移除了默认的 Corepack，推荐直接通过 npm 安装指定版本的 pnpm
RUN npm install -g pnpm@11.15.1
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------
# 阶段 2：编译构建 (builder)
# ---------------------------------------------------
FROM node:25-alpine AS builder
RUN npm install -g pnpm@11.15.1
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 💡 声明构建参数，接收来自 GitHub Actions 的 build-args
ARG POSTGRES_URL
ARG AUTH_SECRET
ARG AUTH_GITHUB_ID
ARG AUTH_GITHUB_SECRET
ARG AUTH_GOOGLE_ID
ARG AUTH_GOOGLE_SECRET

# 将参数转化为构建时的环境变量供 Next.js 编译使用
ENV POSTGRES_URL=$POSTGRES_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV AUTH_GITHUB_ID=$AUTH_GITHUB_ID
ENV AUTH_GITHUB_SECRET=$AUTH_GITHUB_SECRET
ENV AUTH_GOOGLE_ID=$AUTH_GOOGLE_ID
ENV AUTH_GOOGLE_SECRET=$AUTH_GOOGLE_SECRET
ENV NEXT_TELEMETRY_DISABLED=1

# 编译 Next.js
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