## Project Overview

Home Owners Hub is a multi-community platform for homeowners.

Primary features:

1. Authentication (login, registration)
2. Multi-community management
3. Community-scoped chat
4. Community-scoped announcements
5. Role-based admin portal (SUPER_ADMIN global view, COMMUNITY_ADMIN scoped view)
6. AI chat assistant for admins (general-purpose, powered by the Gemini API)

Do not implement additional homeowner management features unless explicitly requested.

Out of Scope:

- Property management
- Maintenance tracking
- Warranties
- Documents
- Expense tracking
- Payments
- Notifications
- Service provider marketplace
- Home analytics
- AI recommendations (homeowner-facing personalized suggestions -- distinct from the admin AI chat assistant above)

---

# Role Model

Two-tier role system:

**Global (user.role):** `SUPER_ADMIN`, `USER`
- `SUPER_ADMIN` -- platform-wide admin, sees all communities, global user management
- `USER` -- regular user, belongs to communities via membership

**Per-community (community_member.role):** `COMMUNITY_ADMIN`, `COMMUNITY_MEMBER`
- `COMMUNITY_ADMIN` -- manages their community (members, chat, announcements); can log into admin portal
- `COMMUNITY_MEMBER` -- participates in their community; cannot access admin portal

SUPER_ADMIN bypasses all community-level permission checks.

---

# Technical Stack

## Backend

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT Authentication
- class-validator
- class-transformer
- bcrypt

## Frontend

- React
- TypeScript
- Vite
- Material UI
- React Router
- React Query
- Axios

## Infrastructure

- Docker
- Docker Compose
- pnpm Workspaces

---

# Monorepo Structure

Use a pnpm workspace.

Repository structure:

/
├── apps/
│ ├── backend/
│ └── frontend/
│
├── packages/
│ └── shared-types/
│
├── docker/
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
└── CLAUDE.md

---

# Workspace Rules

Frontend and backend must remain independent applications.

Backend must never import frontend code.

Frontend must communicate with backend only through API calls.

Shared DTOs, enums, interfaces, and API contracts should live inside:

packages/shared-types

Both frontend and backend may consume shared packages.

---

# Backend Application

Location:

apps/backend

Folder Structure:

apps/backend/src

├── modules/
│ ├── auth/
│ ├── users/
│ ├── communities/
│ ├── community/
│ ├── announcements/
│ ├── dashboard/
│ ├── upload/
│ └── ai-chat/
│
├── database/
│
├── common/
│ ├── guards/
│ ├── decorators/
│ ├── interceptors/
│ ├── filters/
│ └── dto/
│
├── config/
│
└── main.ts

---

# Frontend Application

Location:

apps/frontend

Folder Structure:

apps/frontend/src

├── features/
│ ├── auth/
│ ├── users/
│ ├── communities/
│ ├── community/
│ ├── announcements/
│ ├── dashboard/
│ └── ai-chat/
│
├── components/
├── layouts/
├── hooks/
├── routes/
├── services/
├── utils/
└── App.tsx

---

# Shared Package

Location:

packages/shared-types

Purpose:

- Shared DTO contracts
- Shared enums
- Shared interfaces
- API response types

Structure:

packages/shared-types/src

├── api-response.ts
├── auth.ts
├── user.ts
├── announcement.ts
├── community.ts
├── dashboard.ts
├── upload.ts
└── ai-chat.ts

---

# Database

Use PostgreSQL.

Never use synchronize: true.

Always use migrations.

All schema changes must be migration driven.

---

# Database Tables

## User

Fields:

- id (uuid)
- email
- passwordHash
- firstName
- lastName
- role (SUPER_ADMIN, USER)
- isActive
- profileImageUrl (nullable)
- createdAt
- updatedAt

Indexes:

- email unique

---

## Community

Fields:

- id (uuid)
- name
- code (unique, 8 alphanumeric chars)
- description (nullable)
- isActive (default true)
- createdBy (FK to users)
- createdAt
- updatedAt

---

## CommunityMember

Fields:

- id (uuid)
- userId (FK to users)
- communityId (FK to communities)
- role (COMMUNITY_ADMIN, COMMUNITY_MEMBER)
- joinedAt

Constraints:

- Unique on (userId, communityId)

---

## CommunityMessage

Fields:

- id (uuid)
- message (nullable)
- communityId (FK to communities)
- userId (FK to users)
- attachmentUrl (nullable)
- attachmentType (nullable, values: IMAGE, VIDEO, GIF, FILE)
- attachmentName (nullable)
- createdAt

---

## Announcement

Fields:

- id (uuid)
- title
- content
- communityId (FK to communities)
- createdBy (FK to users)
- createdAt
- updatedAt

---

## AiChatSession

Fields:

- id (uuid)
- userId (FK to users)
- title (derived from the first user message)
- createdAt
- updatedAt

Not scoped to a community -- one user can have many sessions.

---

## AiChatMessage

Fields:

- id (uuid)
- sessionId (FK to ai_chat_sessions, cascade delete)
- role (`user`, `model`)
- content (text)
- createdAt

---

# Authentication

Use JWT access tokens. JWT payload: `{ sub, email, role }`.

After login, the frontend calls `GET /auth/me` to fetch the full profile with community memberships. Community data is NOT stored in the JWT.

Store passwords using bcrypt. Never store plaintext passwords.

Protected routes use guards:
- `JwtAuthGuard` -- validates JWT token
- `RolesGuard` -- checks global user role (SUPER_ADMIN bypasses all)
- `CommunityMemberGuard` -- checks community membership
- `CommunityAdminGuard` -- checks COMMUNITY_ADMIN role in a community
- `AdminGuard` -- checks SUPER_ADMIN or COMMUNITY_ADMIN of any community (for routes with no single :communityId, e.g. AI Chat)

---

# Seed Data

Seeding is a manual step, not automatic on startup.

Run the seed command:

pnpm db:seed

This is idempotent. It creates:

1. Default admin user (admin@homeownershub.com / Admin123! / SUPER_ADMIN)
2. Default community (code: DEFAULT1)
3. Admin membership in the default community as COMMUNITY_ADMIN

---

# Backend Modules

## Auth Module

Endpoints:

- POST /auth/login -- login, returns access token
- POST /auth/register -- register new user, optionally join/create community
- GET /auth/me -- returns current user profile with community memberships

---

## Users Module

SUPER_ADMIN only.

Endpoints:

- GET /users -- list users (paginated, searchable)
- GET /users/:id -- get user
- POST /users -- create user (always USER role; community roles via membership)
- PATCH /users/:id -- update user
- DELETE /users/:id -- delete user

---

## Communities Module

Endpoints:

- GET /communities -- list all communities (SUPER_ADMIN only, with inline stats)
- GET /communities/:id -- get community details
- POST /communities -- create community (any authenticated user; creator becomes COMMUNITY_ADMIN)
- PATCH /communities/:id -- update community (SUPER_ADMIN or COMMUNITY_ADMIN)
- DELETE /communities/:id -- soft-delete, sets isActive=false (SUPER_ADMIN only)
- POST /communities/:id/regenerate-code -- regenerate join code
- GET /communities/:id/stats -- community-scoped stats
- GET /communities/:id/members -- list members (paginated, searchable)
- POST /communities/:id/members -- add member by email
- PATCH /communities/:id/members/:memberId -- update member role
- DELETE /communities/:id/members/:memberId -- remove member
- GET /communities/mine -- list current user's communities
- POST /communities/join -- join community by code

---

## Community (Chat) Module

All endpoints scoped to a community.

Endpoints:

- GET /communities/:communityId/messages -- get messages (paginated, oldest first)
- POST /communities/:communityId/messages -- post message

WebSocket: room-based broadcasting per community. Event: `new-message`.

---

## Announcements Module

All endpoints scoped to a community.

Endpoints:

- GET /communities/:communityId/announcements -- list announcements (newest first)
- POST /communities/:communityId/announcements -- create (COMMUNITY_ADMIN or SUPER_ADMIN)
- PATCH /communities/:communityId/announcements/:id -- update (COMMUNITY_ADMIN or SUPER_ADMIN)
- DELETE /communities/:communityId/announcements/:id -- delete (COMMUNITY_ADMIN or SUPER_ADMIN)

---

## Dashboard Module

SUPER_ADMIN only.

Endpoints:

- GET /dashboard/stats -- global stats (total users, messages, announcements)

Community-scoped stats are at GET /communities/:id/stats.

---

## Upload Module

Authenticated Users.

Endpoints:

- POST /upload

Features:

- Upload files to S3
- Supports profile images (5MB max, images only)
- Supports chat media (25MB max, any type)
- Returns URL, key, type, and filename

---

## AI Chat Module

SUPER_ADMIN or COMMUNITY_ADMIN of any community. Not community-scoped -- sessions belong to the requesting user.

Endpoints:

- GET /ai-chat/sessions -- list current user's sessions, newest active first
- POST /ai-chat/sessions -- create a new empty session
- GET /ai-chat/sessions/:id/messages -- get messages in a session (oldest first)
- POST /ai-chat/sessions/:id/messages -- send a message, get a Gemini reply, persist both
- DELETE /ai-chat/sessions/:id -- delete a session and its messages

Powered by the Gemini API (`@google/genai`) via a `GeminiClient` wrapper. General-purpose chat only -- no access to live platform data.

---

# API Standards

Use DTO validation with class-validator.

Enable global validation pipe.

Return consistent responses.

Success: `{ "success": true, "data": {} }`

Error: `{ "success": false, "message": "Error message" }`

---

# Admin Portal

The frontend is an Admin Portal with two views:

**SUPER_ADMIN view:**
- Sidebar: Dashboard, Users, Communities
- Dashboard shows global stats
- Communities page lists all communities; click into detail view with tabs (Members, Chat, Announcements)

**COMMUNITY_ADMIN view:**
- Sidebar: Dashboard, Members, Chat, Announcements (scoped to their community)
- Dashboard shows community-scoped stats
- Community switcher in header for multi-community admins
- No access to global Users page or Communities list

COMMUNITY_MEMBER cannot access the admin portal.

A floating AI chat assistant (bottom-right button) is available in both views -- opens a chat panel, persists across navigation, and shows an unread badge + notification sound if a reply arrives while the panel is closed.

---

# Admin Login Screen

Fields: Email, Password

Features: Login, Logout, Protected routes

After login, `GET /auth/me` determines portal view based on role and community memberships.

---

# Docker

Two Docker Compose files:

docker-compose.yml -- DB only (local development)

docker-compose.full.yml -- All services: postgres, backend, frontend (full Docker deployment)

---

# Docker Services

## postgres

Port: 5432. Persistent volume required. Both compose files.

## backend

Port: 3000. Depends on postgres. Must auto-run migrations. Only in docker-compose.full.yml.

## frontend

Port: 5173. Depends on backend. Only in docker-compose.full.yml.

---

# Environment Variables

Backend:

DATABASE_HOST
DATABASE_PORT
DATABASE_USER
DATABASE_PASSWORD
DATABASE_NAME

JWT_SECRET

PORT

AWS_S3_BUCKET
AWS_S3_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_ENDPOINT

GEMINI_API_KEY
GEMINI_MODEL

Frontend:

VITE_API_URL

---

# Development Commands

Install:

pnpm install

Start DB and run migrations (local dev):

pnpm db:start

Seed default admin user and community:

pnpm db:seed

Run Backend only:

pnpm dev:api

Run Frontend only:

pnpm dev:frontend

Run Backend and Frontend together:

pnpm dev

Run all services in Docker:

pnpm docker:up

Stop full Docker stack:

pnpm docker:down

Build All:

pnpm build

Test All:

pnpm test

---

# Unit Testing

## Backend

Use Jest (included with NestJS).

Test files live next to the source file:

apps/backend/src/modules/auth/auth.service.spec.ts

What to test:

- Service methods (business logic)
- Guard logic
- DTO validation edge cases

Do not test:

- Controllers in isolation (test via service)
- TypeORM internals
- Framework behavior

Mocking:

- Mock repository methods using jest.fn()
- Mock external dependencies (JwtService, bcrypt) with jest.spyOn or manual mocks
- Do not mock the module under test

Run backend tests:

pnpm --filter backend test

---

## Frontend

Use Vitest and React Testing Library.

Test files live next to the component:

apps/frontend/src/features/auth/LoginForm.test.tsx

What to test:

- User interactions (form submission, button clicks)
- Conditional rendering (loading, error, empty states)
- Hook behavior in isolation when logic is complex

Do not test:

- Material UI component internals
- React Query internals
- Implementation details (state variable names, internal methods)

Mocking:

- Mock API calls with MSW or vi.fn()
- Mock React Router hooks (useNavigate) with vi.mock

Run frontend tests:

pnpm --filter frontend test

---

## General Testing Rules

- One test file per source file
- Test behavior, not implementation
- Prefer descriptive test names: "returns 401 when password is wrong"
- Keep tests simple and readable
- No snapshot tests

---

# Coding Standards

Backend:

- Thin controllers
- Business logic inside services
- Repository pattern through TypeORM
- Dependency injection everywhere
- DTO validation required

Frontend:

- Functional components only
- React Query for data fetching
- Feature-based structure
- Reusable UI components
- Material UI only

General:

- TypeScript strict mode
- No any types unless absolutely necessary
- Prefer readability over clever solutions
- Add proper error handling
- Add loading states
- Add empty states

---

# Security Requirements

- JWT authentication
- Password hashing using bcrypt
- Server-side authorization checks
- DTO validation
- Input sanitization
- Role-based access control (global + per-community)
- Community isolation (members can only access their own community)
- CORS configuration
- Environment variable validation

---

# API Documentation

API.md is the source of truth for all endpoint contracts.

When making any change to a backend endpoint -- adding, removing, or modifying a route, request body, query params, response shape, or error codes -- update API.md in the same task before considering the work done.

---

# AI Coding Instructions

When generating code:

- Generate complete implementations.
- Generate DTOs.
- Generate entities.
- Generate migrations.
- Generate controllers.
- Generate services.
- Generate React pages.
- Generate React Query hooks.
- Generate TypeScript types.
- Include error handling.
- Include loading states.
- Follow NestJS best practices.
- Follow TypeORM best practices.
- Follow React best practices.
- Do not add unnecessary abstractions.
- Do not introduce microservices.
- Keep the architecture simple and maintainable.
- For full Docker deployment use docker-compose.full.yml (pnpm docker:up). For local dev, docker compose up starts DB only and apps run in terminals.
- Use latest version to libraries
- Keep it simple do not over engineer. always simplify, no unnecessary defensive programming. no extra features focus on simplicity.
- Be Consise. Keep README minimal. IMPORTANT: no emojis in code or readme ever.
