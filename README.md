# Home Owners Hub

Admin portal MVP for a homeowners community platform: authentication, community chat, and an announcements feed, managed through an admin portal.

## Stack

- Backend: NestJS, TypeORM, PostgreSQL, JWT authentication
- Frontend: React, Vite, Material UI, React Query
- Shared types: `packages/shared-types`
- pnpm workspaces, Docker Compose

## Local Development

Requires Node 20+ and pnpm (via Corepack).

```
nvm install && nvm use && corepack enable
pnpm init:project
pnpm dev
```

`pnpm init:project` handles everything: installs dependencies, copies `.env` files, starts Docker services (Postgres + LocalStack S3), runs migrations, and seeds the default admin user. It is safe to re-run.

### Default admin login

- Email: `admin@homeownershub.com`
- Password: `Admin123!`

## Full Docker (all services)

To run the entire stack in Docker (DB + backend + frontend):

```
pnpm docker:up
```

To stop:

```
pnpm docker:down
```

This builds and starts all three services. Frontend is served at http://localhost:5173, backend API at http://localhost:3000.

## Testing

```
pnpm test
pnpm --filter backend test
pnpm --filter frontend test
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm init:project` | One-command init: install, env files, Docker, migrations, seed |
| `pnpm db:start` | Start DB in Docker and run migrations |
| `pnpm db:seed` | Seed the default admin user |
| `pnpm dev` | Run backend and frontend in watch mode (DB via Docker) |
| `pnpm dev:api` | Run backend only |
| `pnpm dev:frontend` | Run frontend only |
| `pnpm docker:up` | Build and start all services in Docker |
| `pnpm docker:down` | Stop the full Docker stack |
| `pnpm build` | Build all workspace packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all workspace packages |
| `pnpm db:reset` | Destroy and recreate the database |

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
| `AWS_S3_BUCKET` | S3 bucket name for file uploads | `homeowners-hub-dev` |
| `AWS_S3_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `test` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `test` |
| `AWS_S3_ENDPOINT` | Custom S3 endpoint (for LocalStack) | `http://localhost:4566` |

### Frontend (`apps/frontend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:3000` |

## Project Structure

```
apps/backend            NestJS API
apps/frontend           React admin portal
packages/shared-types   Shared DTOs, enums, and API response types
docker-compose.yml      DB + LocalStack S3 (local dev)
docker-compose.full.yml All services (full Docker deployment)
```
