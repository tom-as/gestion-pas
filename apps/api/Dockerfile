# ── Stage 1: build ───────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/types/package.json ./packages/types/package.json
COPY apps/api/package.json       ./apps/api/package.json

RUN pnpm install --frozen-lockfile

COPY packages/types ./packages/types
COPY apps/api       ./apps/api

RUN pnpm --filter @gestion-pas/types build && \
    pnpm --filter @gestion-pas/api   build

# ── Stage 2: runtime ──────────────────────────────────────────
FROM node:22-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copia manifiestos e instala solo deps de producción en el contexto correcto
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/types/package.json ./packages/types/package.json
COPY apps/api/package.json       ./apps/api/package.json

RUN pnpm install --frozen-lockfile --prod

# Copia artefactos compilados
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/apps/api/dist       ./apps/api/dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
