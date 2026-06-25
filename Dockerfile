# RouterGui — single container: nginx (frontend + reverse proxy) + Node backend
#
# EasyPanel: Build method = Dockerfile, exposed port = 80
# Env vars: JWT_SECRET, PUBLIC_BASE_URL (and optionally DATABASE_URL, PORT)
# Volume:   /app/backend/prisma  (SQLite persistence)

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY shared ./shared
COPY backend ./backend
COPY frontend ./frontend
RUN pnpm --filter backend exec prisma generate
RUN pnpm build

FROM node:20-alpine AS runner
RUN apk add --no-cache nginx
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=file:./prisma/prod.db

COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared/package.json ./shared/package.json
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/frontend/dist ./frontend/dist

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

VOLUME ["/app/backend/prisma"]

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
