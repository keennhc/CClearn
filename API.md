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

## Users

All `/users` endpoints require `ADMIN` role.

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
      "role": "ADMIN | USER",
      "isActive": true,
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
    "role": "ADMIN | USER",
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
  "role": "ADMIN | USER"
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
    "role": "ADMIN | USER",
    "isActive": true,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Errors**

| Status | Message |
|--------|---------|
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
  "role": "ADMIN | USER",
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
    "role": "ADMIN | USER",
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
        "message": "string",
        "createdAt": "ISO8601",
        "user": {
          "id": "uuid",
          "firstName": "string",
          "lastName": "string"
        }
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

Post a new message to the community chat.

**Request body**

```json
{
  "message": "string"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "message": "string",
    "createdAt": "ISO8601",
    "user": {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string"
    }
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

Requires `ADMIN` role. Create a new announcement.

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

Requires `ADMIN` role. Update an existing announcement.

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

Requires `ADMIN` role. Delete an announcement.

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
