# API Reference

Base URL: `http://localhost:3000`

All responses follow this envelope:

```json
// Success
{ "success": true, "data": {} }

// Error
{ "success": false, "message": "Error message" }
```

Authentication uses JWT Bearer tokens. Include the header on protected routes:

```
Authorization: Bearer <accessToken>
```

---

## Auth

### POST /auth/login

Public. Returns a JWT access token.

**Request body**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "accessToken": "string"
  }
}
```

**Errors**

| Status | Message |
|--------|---------|
| 401 | Invalid credentials |

---

### POST /auth/register

Public. Creates a new user account. Optionally joins or creates a community.

`communityCode` and `createCommunity` are mutually exclusive.

**Request body**

```json
{
  "email": "string",
  "password": "string (min 8 characters)",
  "firstName": "string",
  "lastName": "string",
  "communityCode": "string (optional, join existing community as COMMUNITY_MEMBER)",
  "createCommunity": {
    "name": "string",
    "description": "string (optional)"
  }
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "accessToken": "string"
  }
}
```

**Errors**

| Status | Message |
|--------|---------|
| 400 | Cannot both join and create a community during registration |
| 404 | Community not found (invalid code) |
| 409 | Email already in use |

---

### GET /auth/me

Requires authentication. Returns current user profile with community memberships.

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "SUPER_ADMIN | USER",
    "profileImageUrl": "string | null",
    "communities": [
      {
        "communityId": "uuid",
        "communityName": "string",
        "role": "COMMUNITY_ADMIN | COMMUNITY_MEMBER"
      }
    ]
  }
}
```

---

### PATCH /auth/me

Requires authentication. Update the current user's profile fields. All fields are optional.

**Request body**

```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "profileImageUrl": "string | null (optional)"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "SUPER_ADMIN | USER",
    "profileImageUrl": "string | null",
    "communities": [...]
  }
}
```

---

## Dashboard

### GET /dashboard/stats

Requires `SUPER_ADMIN` role. Returns global aggregate counts.

**Response**

```json
{
  "success": true,
  "data": {
    "totalUsers": 0,
    "totalMessages": 0,
    "totalAnnouncements": 0
  }
}
```

---

## Upload

### POST /upload

Requires authentication. Uploads a file to S3.

**Request**

`multipart/form-data` with fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | The file to upload |
| folder | string | Yes | One of: `profile-images`, `chat-media` |

Constraints:
- `profile-images`: 5MB max, image/* only
- `chat-media`: 25MB max, any supported type

**Response**

```json
{
  "success": true,
  "data": {
    "url": "string",
    "key": "string",
    "type": "IMAGE | VIDEO | GIF | FILE",
    "name": "string"
  }
}
```

**Errors**

| Status | Message |
|--------|---------|
| 400 | File is required |
| 400 | Invalid folder |
| 400 | Profile image must be under 5MB |
| 400 | Only image files are allowed for profile images |

---

## Users

All `/users` endpoints require `SUPER_ADMIN` role.

`SUPER_ADMIN` users cannot be created, modified, or deleted via the API.

### GET /users

List all users. Supports optional search by name or email, with pagination.

**Query params**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| search | string | No | | Filter by name or email |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "SUPER_ADMIN | USER",
        "isActive": true,
        "profileImageUrl": "string | null",
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601"
      }
    ],
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

---

### GET /users/:id

Get a single user by ID.

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "SUPER_ADMIN | USER",
    "isActive": true,
    "profileImageUrl": "string | null",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Errors**

| Status | Message |
|--------|---------|
| 404 | User not found |

---

### POST /users

Create a new user. Users are always created with `USER` role. Community roles are managed via community membership.

**Request body**

```json
{
  "email": "string",
  "password": "string (min 8 characters)",
  "firstName": "string",
  "lastName": "string",
  "role": "USER (optional, defaults to USER)"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "SUPER_ADMIN | USER",
    "isActive": true,
    "profileImageUrl": "string | null",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Errors**

| Status | Message |
|--------|---------|
| 403 | Cannot assign SUPER_ADMIN role |
| 409 | Email already in use |

---

### PATCH /users/:id

Update a user. All fields are optional.

**Request body**

```json
{
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "SUPER_ADMIN | USER",
  "isActive": true,
  "profileImageUrl": "string | null"
}
```

**Response**

Same as GET /users/:id.

**Errors**

| Status | Message |
|--------|---------|
| 403 | Super admin users cannot be modified |
| 403 | Cannot assign SUPER_ADMIN role |
| 404 | User not found |
| 409 | Email already in use |

---

### DELETE /users/:id

Delete a user permanently.

**Response**

```json
{
  "success": true,
  "data": null
}
```

**Errors**

| Status | Message |
|--------|---------|
| 403 | Super admin users cannot be deleted |
| 404 | User not found |

---

## Communities

### GET /communities

Requires `SUPER_ADMIN` role. List all active communities with inline stats.

**Query params**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| search | string | No | | Filter by name |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "code": "string",
        "description": "string | null",
        "isActive": true,
        "memberCount": 0,
        "messageCount": 0,
        "announcementCount": 0,
        "createdBy": "uuid",
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601"
      }
    ],
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

---

### GET /communities/mine

Requires authentication. Returns full community objects for all communities the current user belongs to.

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "code": "string",
      "description": "string | null",
      "isActive": true,
      "memberCount": 0,
      "messageCount": 0,
      "announcementCount": 0,
      "createdBy": "uuid",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

---

### POST /communities/join

Requires authentication. Join a community by code as `COMMUNITY_MEMBER`.

**Request body**

```json
{
  "code": "string"
}
```

**Response**

Returns the full community object the user just joined.

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "code": "string",
    "description": "string | null",
    "isActive": true,
    "memberCount": 0,
    "messageCount": 0,
    "announcementCount": 0,
    "createdBy": "uuid",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Errors**

| Status | Message |
|--------|---------|
| 404 | Community not found |
| 409 | Already a member of this community |

---

### GET /communities/:id

Requires `SUPER_ADMIN` or community membership. Get community details.

**Response**

Same shape as a single item in GET /communities response.

---

### POST /communities

Requires authentication. Create a community. Creator becomes `COMMUNITY_ADMIN`.

**Request body**

```json
{
  "name": "string",
  "description": "string (optional)"
}
```

**Response**

Same shape as GET /communities/:id.

---

### PATCH /communities/:id

Requires `SUPER_ADMIN` or `COMMUNITY_ADMIN` of the community.

**Request body**

```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "isActive": "boolean (optional, SUPER_ADMIN only for reactivation)"
}
```

**Response**

Same shape as GET /communities/:id.

**Errors**

| Status | Message |
|--------|---------|
| 404 | Community not found |

---

### DELETE /communities/:id

Requires `SUPER_ADMIN`. Soft-deletes the community (sets `isActive = false`).

**Response**

```json
{
  "success": true,
  "data": null
}
```

**Errors**

| Status | Message |
|--------|---------|
| 404 | Community not found |

---

### POST /communities/:id/regenerate-code

Requires `SUPER_ADMIN` or `COMMUNITY_ADMIN`. Generates a new join code; old code stops working.

**Response**

```json
{
  "success": true,
  "data": {
    "code": "string"
  }
}
```

---

### GET /communities/:id/stats

Requires `SUPER_ADMIN` or community membership. Returns community-scoped stats.

**Response**

```json
{
  "success": true,
  "data": {
    "totalMembers": 0,
    "totalMessages": 0,
    "totalAnnouncements": 0
  }
}
```

---

## Community Members

All member endpoints require `SUPER_ADMIN` or `COMMUNITY_ADMIN` of the community.

### GET /communities/:id/members

List community members. Supports search by name or email, with pagination.

**Query params**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| search | string | No | | Filter by name or email |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "userId": "uuid",
        "communityId": "uuid",
        "role": "COMMUNITY_ADMIN | COMMUNITY_MEMBER",
        "userName": "string",
        "userEmail": "string",
        "firstName": "string",
        "lastName": "string",
        "joinedAt": "ISO8601"
      }
    ],
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

---

### GET /communities/:id/non-members

Requires `SUPER_ADMIN` or `COMMUNITY_ADMIN` of the community. Search for users who are not members of the community. Used to find users when adding new members. Returns up to 20 results.

**Query params**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| search | string | No | | Filter by name or email |

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "firstName": "string",
      "lastName": "string"
    }
  ]
}
```

---

### POST /communities/:id/members

Add a member by email. The user must already have an account.

**Request body**

```json
{
  "email": "string",
  "role": "COMMUNITY_ADMIN | COMMUNITY_MEMBER (optional, defaults to COMMUNITY_MEMBER)"
}
```

**Response**

Single member object (same shape as items in GET response).

**Errors**

| Status | Message |
|--------|---------|
| 404 | User not found -- they must register first |
| 409 | User is already a member of this community |

---

### PATCH /communities/:id/members/:memberId

Update a member's role.

**Request body**

```json
{
  "role": "COMMUNITY_ADMIN | COMMUNITY_MEMBER"
}
```

**Response**

Single member object.

**Errors**

| Status | Message |
|--------|---------|
| 400 | Cannot remove the last admin of a community |
| 404 | Member not found |

---

### DELETE /communities/:id/members/:memberId

Remove a member from the community.

**Response**

```json
{
  "success": true,
  "data": null
}
```

**Errors**

| Status | Message |
|--------|---------|
| 400 | Cannot remove the last admin of a community |
| 404 | Member not found |

---

## Community Messages

All message endpoints require authentication and community membership (or `SUPER_ADMIN`).

### GET /communities/:communityId/messages

Get community chat messages, ordered oldest to newest. Supports pagination.

**Query params**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "message": "string | null",
        "communityId": "uuid",
        "userId": "uuid",
        "userName": "string",
        "userRole": "SUPER_ADMIN | USER",
        "attachmentUrl": "string | null",
        "attachmentType": "IMAGE | VIDEO | GIF | FILE | null",
        "attachmentName": "string | null",
        "createdAt": "ISO8601"
      }
    ],
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

---

### POST /communities/:communityId/messages

Post a new message. At least one of `message` or `attachmentUrl` is required.

**Request body**

```json
{
  "message": "string (optional if attachment present)",
  "attachmentUrl": "string (optional)",
  "attachmentType": "IMAGE | VIDEO | GIF | FILE (optional)",
  "attachmentName": "string (optional)"
}
```

**Response**

Single message object (same shape as items in GET response).

---

### WebSocket: new-message

Real-time updates via Socket.IO. Messages are broadcast to the community room `community:<communityId>`.

Clients must join the room to receive events.

**Event name:** `new-message`

**Payload:** Same shape as the message object in POST response.

---

## Announcements

All announcement endpoints are scoped to a community.

Read access: any community member or `SUPER_ADMIN`.

Write access: `COMMUNITY_ADMIN` of that community or `SUPER_ADMIN`.

### GET /communities/:communityId/announcements

Returns all announcements for the community, ordered newest first.

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "communityId": "uuid",
      "createdBy": "uuid",
      "authorFirstName": "string",
      "authorLastName": "string",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

---

### POST /communities/:communityId/announcements

Create a new announcement.

**Request body**

```json
{
  "title": "string",
  "content": "string"
}
```

**Response**

Single announcement object.

---

### PATCH /communities/:communityId/announcements/:id

Update an existing announcement.

**Request body**

```json
{
  "title": "string (optional)",
  "content": "string (optional)"
}
```

**Response**

Single announcement object.

**Errors**

| Status | Message |
|--------|---------|
| 404 | Announcement not found |

---

### DELETE /communities/:communityId/announcements/:id

Delete an announcement.

**Response**

```json
{
  "success": true,
  "data": null
}
```

**Errors**

| Status | Message |
|--------|---------|
| 404 | Announcement not found |

---

## Common Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Validation error -- check request body |
| 401 | Missing or invalid token |
| 403 | Insufficient role or not a community member |
| 404 | Resource not found |
| 409 | Conflict -- duplicate resource |
| 500 | Internal server error |
