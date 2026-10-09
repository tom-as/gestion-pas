# ── Stage 1: build ───────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/types/package.json ./packages/types/package.json
COPY apps/web/package.json       ./apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY packages/types ./packages/types
COPY apps/web       ./apps/web

RUN pnpm --filter @gestion-pas/types build && \
    pnpm --filter @gestion-pas/web   build

# ── Stage 2: nginx (puerto 8080 — sin root) ───────────────────
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /usr/share/nginx/html /var/cache/nginx \
      /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
