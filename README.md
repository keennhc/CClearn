# Home Owners Hub

Admin portal MVP for a homeowners community platform: authentication, community chat, and an announcements feed, managed through an admin portal.

## Stack

- Backend: NestJS, TypeORM, PostgreSQL, JWT authentication
- Frontend: React, Vite, Material UI, React Query
- Shared types: `packages/shared-types`
- pnpm workspaces, Docker Compose

## Quick Start (Docker)

Requires Docker and Docker Compose.

```
docker compose up --build
```

This starts Postgres, runs database migrations, seeds the default admin user, and serves:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Default admin login

- Email: `admin@homeownershub.com`
- Password: `Admin123!`

## Local Development

Requires Node 20+ and pnpm (via Corepack).

```
nvm install
nvm use
corepack enable
pnpm install
```

Copy the env files:

```
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Start Postgres (e.g. `docker compose up postgres`), then run migrations and start both apps:

```
pnpm --filter backend migration:run:dev
pnpm dev
```

Or run each app individually:

```
pnpm --filter backend start:dev
pnpm --filter frontend dev
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Run backend and frontend in watch mode |
| `pnpm build` | Build all workspace packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all workspace packages |

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_HOST` | Postgres host | `localhost` |
| `DATABASE_PORT` | Postgres port | `5432` |
| `DATABASE_USER` | Postgres user | `postgres` |
| `DATABASE_PASSWORD` | Postgres password | `postgres` |
| `DATABASE_NAME` | Postgres database name | `homeowners_hub` |
| `JWT_SECRET` | Secret used to sign JWTs | `change-me-in-production` |
| `PORT` | Backend HTTP port | `3000` |

### Frontend (`apps/frontend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:3000` |

### Docker Compose (root `.env`, optional)

Copy `.env.example` to `.env` at the repo root to override Compose defaults (Postgres credentials, ports, JWT secret, frontend API URL). All variables have working defaults, so `docker compose up` works without a `.env` file.

## Project Structure

```
apps/backend            NestJS API
apps/frontend           React admin portal
packages/shared-types   Shared DTOs, enums, and API response types
```
