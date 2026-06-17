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

All `/users` endpoints require `ADMIN` or `SUPER_ADMIN` role.

`SUPER_ADMIN` users cannot be created, modified, or deleted via the API.

### GET /users

List all users. Supports optional search by name or email.

**Query params**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| search | string | No | Filter by name or email |

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "SUPER_ADMIN | ADMIN | USER",
      "isActive": true,
      "profileImageUrl": "string | null",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

---

### GET /users/:id

Get a single user by ID.

**Path params**

| Param | Type | Description |
|-------|------|-------------|
| id | uuid | User ID |

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "SUPER_ADMIN | ADMIN | USER",
    "isActive": true,
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

Create a new user.

**Request body**

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "SUPER_ADMIN | ADMIN | USER"
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
    "role": "SUPER_ADMIN | ADMIN | USER",
    "isActive": true,
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

**Path params**

| Param | Type | Description |
|-------|------|-------------|
| id | uuid | User ID |

**Request body**

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "SUPER_ADMIN | ADMIN | USER",
  "isActive": true
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
    "role": "SUPER_ADMIN | ADMIN | USER",
    "isActive": true,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

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

**Path params**

| Param | Type | Description |
|-------|------|-------------|
| id | uuid | User ID |

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

## Community

All `/community` endpoints require authentication.

### GET /community/messages

Get all community chat messages, ordered oldest to newest. Supports pagination.

**Query params**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 50 | Items per page |

**Response**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "message": "string | null",
        "userId": "uuid",
        "userName": "string",
        "attachmentUrl": "string | null",
        "attachmentType": "IMAGE | VIDEO | GIF | FILE | null",
        "attachmentName": "string | null",
        "createdAt": "ISO8601"
      }
    ],
    "total": 0,
    "page": 1,
    "limit": 50
  }
}
```

---

### POST /community/messages

Post a new message to the community chat. At least one of `message` or `attachmentUrl` is required.

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

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "message": "string | null",
    "userId": "uuid",
    "userName": "string",
    "attachmentUrl": "string | null",
    "attachmentType": "IMAGE | VIDEO | GIF | FILE | null",
    "attachmentName": "string | null",
    "createdAt": "ISO8601"
  }
}
```

---

## Announcements

### GET /announcements

Public to authenticated users. Returns all announcements ordered newest first.

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
    "announcements": [
      {
        "id": "uuid",
        "title": "string",
        "content": "string",
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601",
        "createdBy": {
          "id": "uuid",
          "firstName": "string",
          "lastName": "string"
        }
      }
    ],
    "total": 0,
    "page": 1,
    "limit": 20
  }
}
```

---

### POST /announcements

Requires `ADMIN` or `SUPER_ADMIN` role. Create a new announcement.

**Request body**

```json
{
  "title": "string",
  "content": "string"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "createdBy": {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string"
    }
  }
}
```

---

### PATCH /announcements/:id

Requires `ADMIN` or `SUPER_ADMIN` role. Update an existing announcement.

**Path params**

| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Announcement ID |

**Request body**

```json
{
  "title": "string",
  "content": "string"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "createdBy": {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string"
    }
  }
}
```

**Errors**

| Status | Message |
|--------|---------|
| 404 | Announcement not found |

---

### DELETE /announcements/:id

Requires `ADMIN` or `SUPER_ADMIN` role. Delete an announcement.

**Path params**

| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Announcement ID |

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
| 400 | Validation error — check request body |
| 401 | Missing or invalid token |
| 403 | Insufficient role |
| 404 | Resource not found |
| 409 | Conflict — duplicate resource |
| 500 | Internal server error |
