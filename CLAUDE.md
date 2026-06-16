## Project Overview

Home Owners Hub is a community platform for homeowners.

The initial MVP is intentionally small and focused.

Primary features:

1. Authentication
2. Community Chat
3. Announcements Feed
4. Admin Portal

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
- AI recommendations

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

Stack:

- NestJS
- PostgreSQL
- TypeORM

Folder Structure:

apps/backend/src

├── modules/
│ ├── auth/
│ ├── users/
│ ├── community/
│ └── announcements/
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

Stack:

- React
- Material UI
- React Query

Folder Structure:

apps/frontend/src

├── features/
│ ├── auth/
│ ├── users/
│ ├── community/
│ └── announcements/
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

Example Structure:

packages/shared-types/src

├── auth.ts
├── user.ts
├── announcement.ts
└── community.ts

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
- role
- isActive
- createdAt
- updatedAt

Role Values:

- ADMIN
- USER

Indexes:

- email unique

---

## CommunityMessage

Fields:

- id (uuid)
- message
- userId
- createdAt

Relations:

- Many messages belong to one user

---

## Announcement

Fields:

- id (uuid)
- title
- content
- createdBy
- createdAt
- updatedAt

Relations:

- Many announcements belong to one user

---

# Authentication

Authentication is required.

Use JWT access tokens.

Store passwords using bcrypt.

Never store plaintext passwords.

Protected routes must use guards.

Admin routes must require ADMIN role.

---

# Seed Data

On application startup:

Create a default admin user if one does not exist.

Email:

admin@homeownershub.com

Password:

Admin123!

Role:

ADMIN

---

# Backend Modules

## Auth Module

Responsibilities:

- Login
- JWT generation
- Password validation

Endpoints:

POST /auth/login

Request:

{
"email": "admin@homeownershub.com",
"password": "Admin123!"
}

Response:

{
"success": true,
"data": {
"accessToken": "..."
}
}

---

## Users Module

Admin Only

Endpoints:

GET /users

GET /users/:id

POST /users

PATCH /users/:id

DELETE /users/:id

Features:

- Create users
- Edit users
- Delete users
- Disable users
- Search users

---

## Community Module

Authenticated Users

Endpoints:

GET /community/messages

POST /community/messages

Features:

- View community chat history
- Post messages
- Store all messages in PostgreSQL

Future:

- WebSockets for realtime chat

---

## Announcements Module

Endpoints:

GET /announcements

POST /announcements

PATCH /announcements/:id

DELETE /announcements/:id

Permissions:

Admins can create, edit, and delete.

Users can view.

---

# API Standards

Use DTO validation.

Use class-validator.

Enable global validation pipe.

Return consistent responses.

Success:

{
"success": true,
"data": {}
}

Error:

{
"success": false,
"message": "Error message"
}

---

# Admin Portal

The frontend is an Admin Portal.

Only authenticated admins can access it.

---

# Admin Login Screen

Fields:

- Email
- Password

Features:

- Login
- Logout
- Protected routes

Use Material UI.

Design should be clean and modern.

---

# Admin Layout

Use a responsive layout.

Desktop:

- Sidebar
- Top header

Mobile:

- Drawer navigation

Sidebar Menu:

- Dashboard
- Users
- Community Chat
- Announcements

---

# Dashboard Page

Display:

- Total Users
- Total Messages
- Total Announcements

Use simple statistic cards.

---

# Users Page

Features:

- View users
- Search users
- Create users
- Edit users
- Delete users
- Activate/deactivate users

Columns:

- Name
- Email
- Role
- Status
- Created Date

Use Material UI Data Grid.

---

# Community Chat Page

Features:

- View all chat messages
- Post messages as admin
- Pagination

Display:

- User Name
- Message
- Timestamp

Newest messages should appear last.

Chat should feel similar to a messaging app.

---

# Announcements Page

Features:

- Create announcement
- Edit announcement
- Delete announcement
- View announcements

Fields:

Title

Content

Use a multiline text editor.

Rich text editor is optional.

---

# Docker

Application must run using:

docker compose up

---

# Docker Services

## postgres

Port:

5432

Persistent volume required.

---

## backend

Port:

3000

Depends on postgres.

Must automatically run migrations.

---

## frontend

Port:

5173

Depends on backend.

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

Frontend:

VITE_API_URL

---

# Development Commands

Install:

pnpm install

Run Backend:

pnpm --filter backend start:dev

Run Frontend:

pnpm --filter frontend dev

Run All:

pnpm dev

Build All:

pnpm build

Test All:

pnpm test

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
- Role-based access control
- CORS configuration
- Environment variable validation

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
- Ensure the entire application can be started using a single docker compose up command.
- Use latest version to libraries
- Keep it simple do not over engineer. always simplify, no unnecessary defensive programming. no extra features focus on simplicity.
- Be Consise. Keep README minimal. IMPORTANT: no emojis in code or readme ever.
