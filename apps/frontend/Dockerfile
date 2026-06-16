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
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/frontend ./apps/frontend
RUN pnpm --filter @home-owners-hub/shared-types build && \
    pnpm --filter frontend build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/packages/shared-types ./packages/shared-types
COPY --from=build /app/apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
EXPOSE 5173
CMD ["pnpm", "run", "preview"]
