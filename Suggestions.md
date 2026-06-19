# Suggestions

Observations and recommendations from reviewing Plan.md against the current codebase and NewFeatures.md requirements.

---

## 1. Self-Service Community Creation for the App

**Gap**: Requirement 3 says "in the app once registering they will be asked to create their own community or join one." The plan only allows SUPER_ADMIN to create communities.

**Suggestion**: Add a separate endpoint for authenticated users to create their own community:

- `POST /auth/register` with `{ ..., createCommunity: { name, description } }` -- creates user + community in one step, user becomes COMMUNITY_ADMIN
- OR `POST /communities` is accessible to any authenticated user (not just SUPER_ADMIN), and the creator automatically becomes COMMUNITY_ADMIN of the new community

The admin portal's community creation page remains SUPER_ADMIN-only (UI restriction), but the API itself can serve both the portal and the future app.

---

## 2. Add a `GET /auth/me` Endpoint

**Gap**: The current login only returns an access token. The frontend decodes the JWT to get `{ sub, email, role }`. With multi-community, the frontend also needs community memberships, which shouldn't live in the JWT (see next point).

**Suggestion**: Add `GET /auth/me` that returns the current user's full profile plus their community memberships:

```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "SUPER_ADMIN | USER",
  "communities": [
    { "id": "uuid", "name": "string", "role": "COMMUNITY_ADMIN | COMMUNITY_MEMBER" }
  ]
}
```

Call this after login and on page reload (token exists but user state is empty). This is also essential for the future app's session restoration.

---

## 3. Keep the JWT Lean

**Gap**: The plan says to "include the user's community memberships in the JWT payload or login response." Putting memberships in the JWT is problematic -- the token becomes stale when memberships change (added to a community, promoted, removed), and it bloats the token size.

**Suggestion**: Keep the JWT payload as `{ sub, email, role }` (same as today). After login, the frontend calls `GET /auth/me` to fetch memberships. This keeps tokens small and ensures membership data is always fresh.

---

## 4. Split the Migration

**Gap**: The plan has a single migration doing 10 things -- new tables, column additions, data backfill, enum alteration. If any step fails, the whole migration is hard to debug and rollback.

**Suggestion**: Split into 3 migrations:

1. **Migration 1**: Create `communities` and `community_members` tables. Create default community. Backfill community memberships from existing user roles.
2. **Migration 2**: Add `communityId` to `community_messages` and `announcements`. Backfill with default community ID. Set NOT NULL.
3. **Migration 3**: Alter the `user_role_enum` to remove `ADMIN`. Convert existing `ADMIN` users to `USER`.

Each migration is independently testable and the riskiest step (enum alteration) is isolated.

---

## 5. Protect the Last Community Admin

**Gap**: No mention of preventing the last COMMUNITY_ADMIN from being demoted or removed from a community.

**Suggestion**: Add a check in the member update and delete endpoints: if the member is the only COMMUNITY_ADMIN of that community, reject the demotion/removal with a 400 error ("Cannot remove the last admin of a community"). This prevents orphaned communities with no one able to manage them.

---

## 6. Community Code Regeneration

**Gap**: Once a community code is generated, there's no way to change it. If the code leaks to unwanted users, the COMMUNITY_ADMIN has no recourse.

**Suggestion**: Add `POST /communities/:id/regenerate-code` (SUPER_ADMIN or COMMUNITY_ADMIN). Returns the new code. Old code stops working immediately.

---

## 7. Pagination on Community Members

**Gap**: The plan specifies pagination for communities list and messages, but not for the members endpoint.

**Suggestion**: Add pagination + search to `GET /communities/:id/members` using the same `PaginationQueryDto` pattern. Communities could have hundreds of members.

---

## 8. Inline Stats on Communities List

**Suggestion**: When SUPER_ADMIN fetches `GET /communities`, include `memberCount`, `messageCount`, and `announcementCount` in each community object. This gives a useful overview without extra API calls per community, and the admin portal can show these as columns in the communities table.

---

## 9. COMMUNITY_ADMIN Community Switcher

**Suggestion**: For COMMUNITY_ADMIN users managing multiple communities, add a small community switcher dropdown in the top header bar (next to the user email / logout button) rather than a separate `/select-community` page. This lets them switch without navigating away from their current view. Persist the selection in localStorage so it survives page reloads.

---

## 10. Invitation Flow for Adding Members

**Gap**: The plan says COMMUNITY_ADMIN can "add members" but doesn't specify the UX. Adding by user ID or email requires the person to already have an account.

**Suggestion for now (keep it simple)**: Add members by email. If the email matches an existing user, add them immediately. If not, return an error ("User not found -- they must register first").

**Future consideration**: An invite-by-email flow (creates a pending invite, sends email with a link + community code) would be more user-friendly but is likely out of scope for this phase.

---

## 11. Soft Delete for Communities

**Suggestion**: Instead of hard-deleting communities (which cascades all messages, announcements, and memberships), consider adding an `isActive` flag to the communities table. Deactivated communities are hidden from all views but data is preserved. SUPER_ADMIN can reactivate. This protects against accidental deletion.

Not strictly required -- depends on how destructive you're comfortable being. Hard delete is simpler. Flag it as a decision to make.

---

## 12. App-Ready API Considerations (Requirement 7)

APIs the future app will likely need beyond what the admin portal uses:

- `GET /auth/me` -- session restoration (suggestion 2)
- `POST /auth/register` with community creation option (suggestion 1)  
- `POST /communities/join` with `{ code }` -- join a community by code (separate from being added by admin)
- `GET /communities/mine` -- list communities the current user belongs to
- `PATCH /auth/me` -- update own profile (name, email, profile image) without needing admin privileges
- `POST /auth/change-password` -- self-service password change

These aren't all required now, but worth designing the community endpoints with these in mind so we don't need to restructure later.
