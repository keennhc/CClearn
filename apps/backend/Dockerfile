FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/backend ./apps/backend
RUN pnpm --filter @home-owners-hub/shared-types build && \
    pnpm --filter backend build && \
    pnpm prune --prod

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages/shared-types ./packages/shared-types
COPY --from=build /app/apps/backend ./apps/backend
WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["sh", "-c", "pnpm run migration:run && node dist/main.js"]
