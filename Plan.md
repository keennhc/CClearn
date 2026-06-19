# Multi-Community Feature Plan

## Summary

Transform the app from a single-community model to a multi-community architecture where each community is isolated with its own chat, announcements, and members. Introduce community-level roles, a community join code, a registration API for the future app, and role-based admin portal views -- SUPER_ADMIN sees all communities globally, while COMMUNITY_ADMIN sees and manages only their own community.

---

## Key Architectural Decisions

### Role Model

Current roles (global `user.role` enum):
- `SUPER_ADMIN`, `ADMIN`, `USER`

New model -- two levels of roles:

**Global (user.role):** `SUPER_ADMIN`, `USER`
- `SUPER_ADMIN` -- platform-wide admin, sees all communities, accesses admin portal with global view
- `USER` -- regular user, belongs to one or more communities; if they are `COMMUNITY_ADMIN` in any community, they can log into the admin portal and see a scoped view of their community only

**Per-community (community_member.role):** `COMMUNITY_ADMIN`, `COMMUNITY_MEMBER`
- `COMMUNITY_ADMIN` -- manages their community (members, chat, announcements)
- `COMMUNITY_MEMBER` -- participates in their community

`ADMIN` and `USER` enum values in the global role are replaced. Existing `ADMIN` users migrate to `USER` globally and get `COMMUNITY_ADMIN` in a default community. Existing `USER` users become `COMMUNITY_MEMBER` in that default community.

### Community Isolation

- Every `community_message` and `announcement` belongs to exactly one community.
- All existing messages and announcements migrate to a default community.
- API endpoints for chat and announcements require a `communityId` parameter.
- SUPER_ADMIN can access any community. Community members can only access their own.

### Admin Portal Scope

The admin portal supports two access levels based on the logged-in user's role:

**SUPER_ADMIN view (global)**
- Dashboard: global stats (total users, messages, announcements across all communities)
- Users: global user management (create, edit, delete, deactivate)
- Communities: list all communities (with inline stats), create new, click into any community's detail view
- Community detail: community info header (name, code, description) + tabs for Members, Chat, Announcements

**COMMUNITY_ADMIN view (scoped)**
- A `USER` who is `COMMUNITY_ADMIN` in at least one community can log into the admin portal
- If they admin multiple communities, a switcher dropdown in the top header bar lets them switch without navigating away; active community persisted in localStorage
- Dashboard: stats scoped to their community (members, messages, announcements)
- Members: manage members of their community (add by email, remove, change roles)
- Chat: view and post in their community chat
- Announcements: create, edit, delete announcements for their community
- No access to: global Users page, Communities list, other communities

**COMMUNITY_MEMBER**
- Cannot log into the admin portal (will use the future app)

**Sidebar by role**
- SUPER_ADMIN: Dashboard, Users, Communities
- COMMUNITY_ADMIN: Dashboard, Members, Chat, Announcements (with community name in sidebar header)

### JWT and Session Strategy

Keep the JWT payload lean: `{ sub, email, role }` (same as today). Do not put community memberships in the token -- they go stale when memberships change and bloat the token size.

After login, the frontend calls `GET /auth/me` to fetch the full user profile including community memberships. This endpoint is also called on page reload when the token exists but user state is empty (session restoration).

---

## Phase 1: Shared Types

Update `packages/shared-types/src/` with new types.

### New files

**`community.ts`** (replaces the existing file which currently holds `CommunityMessage` and `AttachmentType`):
- `Community` interface: `id, name, code, description, isActive, memberCount, messageCount, announcementCount, createdBy, createdAt, updatedAt`
- `CommunityMemberRole` enum: `COMMUNITY_ADMIN`, `COMMUNITY_MEMBER`
- `CommunityMember` interface: `id, userId, communityId, role, userName, userEmail, joinedAt`
- `CommunityMessage` interface (moved from current file): add `communityId` field
- `AttachmentType` enum (moved from current file): unchanged
- `CreateCommunityDto`, `UpdateCommunityDto`
- `AddCommunityMemberDto` (email-based: `{ email, role }`)
- `UpdateCommunityMemberRoleDto` (`{ role }`)

**`auth.ts`** (update existing):
- `RegisterDto`: `{ email, password, firstName, lastName, communityCode?, createCommunity?: { name, description } }`
- `AuthProfile` interface: `{ id, email, firstName, lastName, role, profileImageUrl, communities: [{ id, name, role }] }`

### Modified files
- `user.ts` -- `UserRole` enum: remove `ADMIN`, keep `SUPER_ADMIN` and `USER`
- `dashboard.ts` -- add `CommunityStats` interface: `{ totalMembers, totalMessages, totalAnnouncements }`

---

## Phase 2: Database Schema

### New entities

**Community** (`communities` table)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | varchar | |
| code | varchar | unique, generated (8 alphanumeric chars) |
| description | text | nullable |
| isActive | boolean | default true |
| createdBy | uuid | FK to users |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**CommunityMember** (`community_members` table)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK to users |
| communityId | uuid | FK to communities |
| role | enum | COMMUNITY_ADMIN, COMMUNITY_MEMBER |
| joinedAt | timestamp | |

Unique constraint on (userId, communityId).

### Modified entities

**CommunityMessage** -- add `communityId` (uuid, FK to communities, NOT NULL)

**Announcement** -- add `communityId` (uuid, FK to communities, NOT NULL)

**User** -- role enum changes from `(SUPER_ADMIN, ADMIN, USER)` to `(SUPER_ADMIN, USER)`

### Migration strategy

Split into 3 migrations for safety:

**Migration 1 -- New tables and community memberships**
1. Create `communities` table (with `isActive` column)
2. Create `community_members` table with unique constraint on (userId, communityId)
3. Insert a "Default Community" owned by the SUPER_ADMIN seed user (look up by email `admin@homeownershub.com`; skip if no users exist)
4. For each existing `ADMIN` user: create `COMMUNITY_ADMIN` membership in default community
5. For each existing `USER` user: create `COMMUNITY_MEMBER` membership in default community

**Migration 2 -- Scope existing data to communities**
1. Add `communityId` column to `community_messages` (nullable initially)
2. Add `communityId` column to `announcements` (nullable initially)
3. Backfill all existing messages and announcements with the default community ID
4. Set `communityId` to NOT NULL on both tables
5. Add foreign key constraints

**Migration 3 -- Role enum cleanup**
1. Convert all `ADMIN` users to `USER` role
2. Alter the Postgres enum type: rename `user_role_enum`, create new enum without `ADMIN`, update column, drop old enum

---

## Phase 3: Backend -- Communities Module

New module: `apps/backend/src/modules/communities/`

### Files to create
- `entities/community.entity.ts`
- `entities/community-member.entity.ts`
- `communities.controller.ts`
- `communities.service.ts`
- `communities.module.ts`
- `dto/create-community.dto.ts`
- `dto/update-community.dto.ts`
- `dto/add-member.dto.ts`
- `dto/update-member-role.dto.ts`
- `dto/query-communities.dto.ts`
- `dto/query-members.dto.ts`

### Endpoints

**Community CRUD**
- `GET /communities` -- list all communities, paginated, searchable (SUPER_ADMIN only). Response includes inline stats: `memberCount`, `messageCount`, `announcementCount` per community.
- `GET /communities/:id` -- get community details (SUPER_ADMIN or COMMUNITY_ADMIN of that community)
- `POST /communities` -- create community (any authenticated user). Generates unique join code. Creator becomes COMMUNITY_ADMIN. The admin portal UI restricts this to SUPER_ADMIN, but the API serves both portal and future app.
- `PATCH /communities/:id` -- update community name/description (SUPER_ADMIN or COMMUNITY_ADMIN of that community)
- `DELETE /communities/:id` -- soft-delete (set `isActive = false`). SUPER_ADMIN only. Deactivated communities are hidden from all views but data is preserved. SUPER_ADMIN can reactivate via PATCH.

**Community Members (paginated, searchable)**
- `GET /communities/:id/members` -- list members (SUPER_ADMIN or COMMUNITY_ADMIN of that community). Paginated with search by name/email.
- `POST /communities/:id/members` -- add member by email (SUPER_ADMIN or COMMUNITY_ADMIN). Request: `{ email, role }`. If email matches an existing user, add immediately. If not, return 404 ("User not found -- they must register first").
- `PATCH /communities/:id/members/:memberId` -- update member role (SUPER_ADMIN or COMMUNITY_ADMIN). Cannot demote the last COMMUNITY_ADMIN (400: "Cannot remove the last admin of a community").
- `DELETE /communities/:id/members/:memberId` -- remove member (SUPER_ADMIN or COMMUNITY_ADMIN). Cannot remove the last COMMUNITY_ADMIN (same guard).

**Community Code**
- `POST /communities/:id/regenerate-code` -- generate a new join code, old code stops working (SUPER_ADMIN or COMMUNITY_ADMIN of that community)

**Community Stats**
- `GET /communities/:id/stats` -- returns `{ totalMembers, totalMessages, totalAnnouncements }` (SUPER_ADMIN or COMMUNITY_ADMIN of that community). Used by the community-scoped dashboard.

### Community code generation
- Generate a short alphanumeric code (8 uppercase characters) on community creation.
- Ensure uniqueness via DB unique constraint + retry on collision.

### Business rules
- Last COMMUNITY_ADMIN protection: before demoting or removing a COMMUNITY_ADMIN, count remaining admins. If this is the last one, reject with 400.
- Soft delete: `DELETE /communities/:id` sets `isActive = false`. All queries filter by `isActive = true` unless SUPER_ADMIN explicitly requests inactive communities.

---

## Phase 4: Backend -- Update Existing Modules

### Auth Module
- Add `GET /auth/me`:
  - Returns current user profile + community memberships
  - Response: `{ id, email, firstName, lastName, role, profileImageUrl, communities: [{ id, name, role }] }`
  - Called by frontend after login and on page reload for session restoration
- Add `POST /auth/register`:
  - Request: `{ email, password, firstName, lastName, communityCode?, createCommunity?: { name, description } }`
  - Creates a `USER` account
  - If `communityCode` provided: look up community by code, add user as `COMMUNITY_MEMBER`
  - If `createCommunity` provided: create new community, add user as `COMMUNITY_ADMIN`
  - If neither: create user with no community membership
  - `communityCode` and `createCommunity` are mutually exclusive (400 if both provided)
  - Returns `{ accessToken }` (same as login)
- Keep `POST /auth/login` response unchanged (`{ accessToken }`). Frontend calls `GET /auth/me` after login to get memberships.
- Keep JWT payload as `{ sub, email, role }` -- no community data in the token.

### App-Ready Auth Endpoints (for future app)
- `POST /communities/join` -- join a community by code. Request: `{ code }`. Authenticated user becomes `COMMUNITY_MEMBER`. Separate from being added by admin.
- `GET /communities/mine` -- list communities the current user belongs to (with their role in each). Any authenticated user.

### Community (Chat) Module
- Scope all message endpoints under a community:
  - `GET /communities/:communityId/messages` (replaces `GET /community/messages`)
  - `POST /communities/:communityId/messages` (replaces `POST /community/messages`)
- Remove old `/community/messages` routes.
- Validate that the requesting user is a member of the community (or SUPER_ADMIN).
- WebSocket: use room-based broadcasting scoped to community. Clients join a room named by communityId. Messages only broadcast to that room.

### Announcements Module
- Scope all announcement endpoints under a community:
  - `GET /communities/:communityId/announcements` (replaces `GET /announcements`)
  - `POST /communities/:communityId/announcements`
  - `PATCH /communities/:communityId/announcements/:id`
  - `DELETE /communities/:communityId/announcements/:id`
- Remove old `/announcements` routes.
- Write operations: COMMUNITY_ADMIN of that community or SUPER_ADMIN.
- Read operations: any member of that community or SUPER_ADMIN.

### Users Module
- Restrict to SUPER_ADMIN only: update `@Roles(UserRole.ADMIN)` to `@Roles(UserRole.SUPER_ADMIN)`. Since SUPER_ADMIN already bypasses the roles guard, this is effectively the same, but the decorator should be correct for clarity.
- Update `CreateUserDto`: remove `role` field. Users are always created as `USER`. Community roles are managed via community membership.
- Update `UpdateUserDto`: `role` can only be `SUPER_ADMIN` or `USER`.

### Dashboard Module
- `GET /dashboard/stats` -- keep for SUPER_ADMIN, returns global stats (unchanged).
- Community-scoped stats are served by `GET /communities/:id/stats` (in the communities module).

### Upload Module
- No changes needed (uploads are user-scoped, not community-scoped).

### Guards
- `RolesGuard`: no changes needed. SUPER_ADMIN bypass already works. Only used for global role checks.
- New `CommunityMemberGuard`: extracts `communityId` from route params, checks that the requesting user is a member of that community. SUPER_ADMIN bypasses.
- New `CommunityAdminGuard`: same as above but requires `COMMUNITY_ADMIN` role in that community. SUPER_ADMIN bypasses.

### Seed Script
- Update to also create a "Default Community" (idempotent -- skip if it already exists).
- Make the SUPER_ADMIN seed user the COMMUNITY_ADMIN of the default community.

---

## Phase 5: Frontend -- Communities & Role-Based Portal

### New files
- `features/communities/` -- feature folder
  - `CommunitiesPage.tsx` -- list all communities with search, inline stats columns (SUPER_ADMIN only)
  - `CommunityDetailPage.tsx` -- community info header (name, code, description) + tabs (Members, Chat, Announcements)
  - `CreateCommunityDialog.tsx` -- form to create community (name, description)
  - `CommunityMembersTab.tsx` -- manage members (add by email, remove, change roles). Paginated with search.
  - `CommunityChatTab.tsx` -- reuse chat component, scoped to community
  - `CommunityAnnouncementsTab.tsx` -- reuse announcements component, scoped to community
- `services/communities.ts` -- API service for all community endpoints
- `hooks/useCommunities.ts` -- React Query hooks

### Routing

**SUPER_ADMIN routes:**
- `/dashboard` -- global dashboard
- `/users` -- global user management
- `/communities` -- communities list
- `/communities/:id` -- community detail (tabs: Members, Chat, Announcements)

**COMMUNITY_ADMIN routes:**
- `/dashboard` -- community-scoped dashboard (auto-scoped to active community)
- `/members` -- members of active community
- `/chat` -- active community chat
- `/announcements` -- active community announcements

Remove old `/community` and `/announcements` top-level routes.

**Home redirect (`/`):**
- SUPER_ADMIN -> `/dashboard`
- COMMUNITY_ADMIN -> `/dashboard` (with active community auto-selected)

### Sidebar

**SUPER_ADMIN sidebar:** Dashboard, Users, Communities

**COMMUNITY_ADMIN sidebar:** Dashboard, Members, Chat, Announcements (community name shown in sidebar header below "Home Owners Hub")

### Top header bar
- Left: page title (existing)
- Right: community switcher dropdown (COMMUNITY_ADMIN with multiple communities only), user email, logout button

### Auth & login flow
- Update `ProtectedRoute`:
  - Allow access if SUPER_ADMIN or if user is COMMUNITY_ADMIN in any community
  - Reject COMMUNITY_MEMBER-only users with redirect to a "no access" message or login page
  - Auth context must be populated (via `GET /auth/me`) before rendering protected content
- After login:
  1. Store JWT token
  2. Call `GET /auth/me` to get profile + community memberships
  3. Determine portal mode:
     - SUPER_ADMIN -> global view
     - COMMUNITY_ADMIN of 1 community -> auto-select that community, scoped view
     - COMMUNITY_ADMIN of N communities -> auto-select first (or last used from localStorage), show switcher in header
     - No COMMUNITY_ADMIN memberships -> show error "You do not have admin access"
  4. Navigate to `/dashboard`

---

## Phase 6: Frontend -- Update Existing Pages

### Auth Context
- Replace single `isAdmin` boolean with richer role info:
  - `isSuperAdmin` -- true if user.role is SUPER_ADMIN
  - `isCommunityAdmin` -- true if user is COMMUNITY_ADMIN in any community
  - `activeCommunityId` -- the currently selected community (set for COMMUNITY_ADMIN; null for SUPER_ADMIN unless they drill into a community)
  - `setActiveCommunity(id)` -- setter for switching communities
  - `communities` -- list of user's community memberships with roles (from `GET /auth/me`)
- Portal access: allowed if `isSuperAdmin || isCommunityAdmin`
- On init: if token exists, call `GET /auth/me` to populate context (replaces current JWT-only decoding)

### Dashboard
- SUPER_ADMIN: global stats via `GET /dashboard/stats` (existing behavior)
- COMMUNITY_ADMIN: community-scoped stats via `GET /communities/:communityId/stats`
- Reuse the same `DashboardPage` component, fetch different endpoint based on `isSuperAdmin`

### Users Page
- SUPER_ADMIN only (hidden from COMMUNITY_ADMIN sidebar, route guarded)
- Update role dropdown in create/edit user forms: only `SUPER_ADMIN` and `USER`
- Remove any references to `ADMIN` role

### Community Chat
- Refactor into a reusable component that accepts `communityId` as prop
- SUPER_ADMIN: accessed via `CommunityDetailPage` tabs (communityId from route params)
- COMMUNITY_ADMIN: accessed as top-level `/chat` route (communityId from auth context)
- Update API calls to use `/communities/:communityId/messages`
- WebSocket: join community-specific room on mount, leave on unmount or community switch

### Announcements
- Refactor into a reusable component that accepts `communityId` as prop
- SUPER_ADMIN: accessed via `CommunityDetailPage` tabs (communityId from route params)
- COMMUNITY_ADMIN: accessed as top-level `/announcements` route (communityId from auth context)
- Update API calls to use `/communities/:communityId/announcements`

### Members
- Reusable component that accepts `communityId` as prop (same component as `CommunityMembersTab`)
- SUPER_ADMIN: accessed via `CommunityDetailPage` tabs
- COMMUNITY_ADMIN: accessed as top-level `/members` route

---

## Phase 7: Tests

### Backend unit tests to update
- `auth.service.spec.ts` -- add register tests, add `GET /auth/me` tests
- `users.service.spec.ts` -- update role references (ADMIN -> USER)
- `community.service.spec.ts` -- update for community scoping (communityId required)
- `announcements.service.spec.ts` -- update for community scoping (communityId required)
- `roles.guard.spec.ts` -- update role enum values, remove ADMIN references

### Backend unit tests to create
- `communities.service.spec.ts` -- community CRUD, member management, last-admin protection, soft delete, code regeneration
- `community-member.guard.spec.ts` -- membership validation, SUPER_ADMIN bypass
- `community-admin.guard.spec.ts` -- admin role validation, SUPER_ADMIN bypass

### Frontend tests to update
- Auth context tests -- update for new role model (`isSuperAdmin`, `isCommunityAdmin`, `activeCommunityId`)
- ProtectedRoute tests -- test SUPER_ADMIN access, COMMUNITY_ADMIN access, COMMUNITY_MEMBER rejection
- Update role-related tests for new enum values
- Update API mock URLs for community-scoped endpoints

---

## Phase 8: Documentation

- **CLAUDE.md** -- update: role model (two-tier), database tables (new entities + modified entities), module descriptions (communities module), API endpoints (scoped routes), sidebar menu (by role), seed data info (default community), environment variables (if any new ones)
- **API.md** -- full rewrite: add communities endpoints, add community-scoped chat/announcement endpoints, add register endpoint, add `GET /auth/me`, add `POST /communities/join`, add `GET /communities/mine`, remove old `/community/messages` and `/announcements` routes
- **README** -- update if architecture description changes

---

## Implementation Order

| Step | Phase | Description |
|------|-------|-------------|
| 1 | 1 | Update shared types (roles, community interfaces, auth profile) |
| 2 | 2 | Write migration 1 (new tables, default community, backfill memberships) |
| 3 | 2 | Write migration 2 (add communityId to messages/announcements, backfill) |
| 4 | 2 | Write migration 3 (role enum cleanup) |
| 5 | 2 | Create new entities (Community, CommunityMember) |
| 6 | 3 | Build communities module (CRUD, members, stats, code regen, guards) |
| 7 | 4 | Update auth module (register, GET /auth/me, keep JWT lean) |
| 8 | 4 | Add app-ready endpoints (POST /communities/join, GET /communities/mine) |
| 9 | 4 | Update community chat module (scope to community, room-based WebSocket) |
| 10 | 4 | Update announcements module (scope to community) |
| 11 | 4 | Update users module (SUPER_ADMIN only, new role values) |
| 12 | 4 | Update dashboard module (global stats unchanged) |
| 13 | 4 | Update seed script (default community) |
| 14 | 5 | Update auth context (role-based portal mode, active community, GET /auth/me on init) |
| 15 | 5 | Update frontend routing and sidebar (dual layout by role) |
| 16 | 5 | Build frontend communities page (SUPER_ADMIN) |
| 17 | 5 | Build community detail page with tabs |
| 18 | 6 | Refactor chat, announcements, members into reusable communityId-prop components |
| 19 | 6 | Update dashboard page (role-based stats) |
| 20 | 6 | Build community switcher in header (COMMUNITY_ADMIN) |
| 21 | 7 | Update and add unit tests |
| 22 | 8 | Update CLAUDE.md, API.md, README |

---

## Risks and Considerations

- **Migration complexity**: Changing an enum in Postgres requires careful handling (TypeORM doesn't auto-drop enum values). Isolated in migration 3 so it can be debugged independently.
- **Data migration**: All existing messages and announcements must be assigned to the default community. If the DB is empty (dev), this is trivial. Migrations handle this gracefully by checking for existing data.
- **Breaking API changes**: Chat and announcement endpoints move from top-level to nested under `/communities/:id`. Old routes are removed. Frontend must update all API calls in the same deployment.
- **Seed data**: The seed script must also create the default community and assign the SUPER_ADMIN as its COMMUNITY_ADMIN. Must be idempotent.
- **WebSocket rooms**: The current WebSocket broadcasts to all connected clients. Must be scoped to community rooms so messages don't leak across communities.
- **Portal login for community admins**: After authentication, the frontend calls `GET /auth/me` to check community memberships. A `USER` with no `COMMUNITY_ADMIN` membership is shown an error message and not allowed into the portal.
- **Multi-community admins**: A user who is `COMMUNITY_ADMIN` in multiple communities sees a switcher dropdown in the header. Active community persisted in localStorage. All scoped API calls use the active communityId from auth context.
- **Shared components**: Chat, announcements, and members components are used in two contexts (SUPER_ADMIN community detail tabs and COMMUNITY_ADMIN top-level pages). Built as reusable components that accept `communityId` as a prop.
- **Last admin protection**: The communities service must prevent removing or demoting the last COMMUNITY_ADMIN of any community to avoid orphaned communities.
- **Soft delete**: Community deletion is soft (sets `isActive = false`). All queries filter inactive communities. SUPER_ADMIN can reactivate. This prevents accidental data loss.
