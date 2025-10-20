# Prompt API Documentation

## Overview

RESTful API for managing AI generation prompts in the Wavelength Lore system. All endpoints support JSON request/response format.

**Base URL:** `/api/prompts`

**Authentication:** Most write operations require admin or moderator role via group-based authentication.

---

## Endpoints

### GET /api/prompts

Get all prompts with optional filtering.

**Authentication:** None (public read access)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (character, location, scene, villain, general) |
| `character` | string | Filter by linked character ID |
| `episode` | string | Filter by linked episode ID |
| `lore` | string | Filter by linked lore ID |
| `tag` | string | Filter by tag |
| `search` | string | Search in keywords, tags, title, or content |
| `includeInactive` | boolean | Include soft-deleted prompts (admin only) |

**Example Requests:**

```bash
# Get all prompts
GET /api/prompts

# Get character prompts
GET /api/prompts?category=character

# Get prompts linked to Andrew
GET /api/prompts?character=andrew

# Get prompts for The Shire
GET /api/prompts?lore=the-shire

# Search prompts
GET /api/prompts?search=golden+hour

# Get prompts with performance tag
GET /api/prompts?tag=performance
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "andrew-golden-hour",
      "title": "Andrew at Golden Hour",
      "keywords": ["andrew", "golden hour", "performance"],
      "content": "A hyper-detailed, photorealistic...",
      "linkedCharacters": ["andrew"],
      "linkedEpisodes": [],
      "linkedLore": ["the-shire"],
      "category": "character",
      "tags": ["performance", "magical"],
      "version": 1,
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "filters": {
    "category": null,
    "character": "andrew",
    "episode": null,
    "lore": null,
    "tag": null,
    "search": null
  },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

### GET /api/prompts/categories

Get all available prompt categories.

**Authentication:** None (public read access)

**Example Request:**

```bash
GET /api/prompts/categories
```

**Response:**

```json
{
  "success": true,
  "data": ["character", "location", "scene", "villain", "general"],
  "count": 5,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

### GET /api/prompts/tags

Get all available prompt tags.

**Authentication:** None (public read access)

**Example Request:**

```bash
GET /api/prompts/tags
```

**Response:**

```json
{
  "success": true,
  "data": ["battle", "magical", "performance", "realistic", "shire"],
  "count": 5,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

### GET /api/prompts/:id

Get a single prompt by ID.

**Authentication:** None (public read access)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Prompt ID |

**Example Request:**

```bash
GET /api/prompts/andrew-golden-hour
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "andrew-golden-hour",
    "title": "Andrew at Golden Hour",
    "keywords": ["andrew", "golden hour", "performance"],
    "content": "A hyper-detailed, photorealistic spring forest...",
    "linkedCharacters": ["andrew"],
    "linkedEpisodes": [],
    "linkedLore": ["the-shire"],
    "category": "character",
    "tags": ["performance", "magical"],
    "version": 1,
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "Prompt not found",
  "id": "non-existent-id"
}
```

---

### POST /api/prompts

Create a new prompt.

**Authentication:** Required (admin or moderator role)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique prompt ID |
| `title` | string | Yes | Prompt title |
| `content` | string | Yes | Prompt content (markdown) |
| `keywords` | string[] | No | Search keywords |
| `linkedCharacters` | string[] | No | Linked character IDs |
| `linkedEpisodes` | string[] | No | Linked episode IDs |
| `linkedLore` | string[] | No | Linked lore IDs |
| `category` | string | No | Category (default: 'general') |
| `tags` | string[] | No | Tags for organization |

**Example Request:**

```bash
POST /api/prompts
Content-Type: application/json

{
  "id": "new-prompt",
  "title": "New Prompt Title",
  "content": "This is the prompt content...",
  "keywords": ["keyword1", "keyword2"],
  "linkedCharacters": ["andrew"],
  "category": "character",
  "tags": ["performance", "magical"]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "new-prompt",
    "title": "New Prompt Title",
    "content": "This is the prompt content...",
    "keywords": ["keyword1", "keyword2"],
    "linkedCharacters": ["andrew"],
    "linkedEpisodes": [],
    "linkedLore": [],
    "category": "character",
    "tags": ["performance", "magical"],
    "version": 1,
    "isActive": true,
    "createdAt": "2025-01-15T12:00:00Z",
    "updatedAt": "2025-01-15T12:00:00Z",
    "createdBy": "user-123"
  },
  "message": "Prompt created successfully",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - Missing fields
{
  "success": false,
  "error": "Missing required fields",
  "required": ["id", "title", "content"]
}

// 409 Conflict - Prompt exists
{
  "success": false,
  "error": "Prompt already exists",
  "id": "new-prompt"
}
```

---

### PUT /api/prompts/:id

Update an existing prompt.

**Authentication:** Required (admin or moderator role)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Prompt ID |

**Request Body:** Same as POST, all fields optional

**Example Request:**

```bash
PUT /api/prompts/andrew-golden-hour
Content-Type: application/json

{
  "title": "Updated Title",
  "tags": ["performance", "magical", "spring"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "andrew-golden-hour",
    "title": "Updated Title",
    "version": 2,
    "updatedAt": "2025-01-15T12:00:00Z",
    "updatedBy": "user-123"
  },
  "message": "Prompt updated successfully",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "Prompt not found",
  "id": "non-existent-id"
}
```

---

### PATCH /api/prompts/:id

Partially update a prompt (alias for PUT).

**Authentication:** Required (admin or moderator role)

Same as PUT endpoint.

---

### DELETE /api/prompts/:id

Delete a prompt (soft delete by default).

**Authentication:** Required (admin role)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Prompt ID |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `hard` | boolean | If 'true', permanently delete (use with caution) |

**Example Requests:**

```bash
# Soft delete (sets isActive to false)
DELETE /api/prompts/andrew-golden-hour

# Hard delete (permanently removes)
DELETE /api/prompts/andrew-golden-hour?hard=true
```

**Response (Soft Delete):**

```json
{
  "success": true,
  "message": "Prompt soft deleted (can be restored)",
  "data": {
    "id": "andrew-golden-hour",
    "isActive": false,
    "deletedAt": "2025-01-15T12:00:00Z",
    "deletedBy": "user-123"
  },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**Response (Hard Delete):**

```json
{
  "success": true,
  "message": "Prompt permanently deleted",
  "id": "andrew-golden-hour",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

### POST /api/prompts/:id/restore

Restore a soft-deleted prompt.

**Authentication:** Required (admin role)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Prompt ID |

**Example Request:**

```bash
POST /api/prompts/andrew-golden-hour/restore
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Prompt restored successfully",
  "data": {
    "id": "andrew-golden-hour",
    "isActive": true,
    "restoredAt": "2025-01-15T12:00:00Z",
    "restoredBy": "user-123"
  },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "Prompt is not deleted",
  "id": "andrew-golden-hour"
}
```

---

### POST /api/prompts/:id/link

Add links to characters, episodes, or lore.

**Authentication:** Required (admin or moderator role)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Prompt ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `characters` | string[] | No | Character IDs to link |
| `episodes` | string[] | No | Episode IDs to link |
| `lore` | string[] | No | Lore IDs to link |

**Example Request:**

```bash
POST /api/prompts/andrew-golden-hour/link
Content-Type: application/json

{
  "characters": ["jewel"],
  "episodes": ["my-lucky-charm"],
  "lore": []
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "andrew-golden-hour",
    "linkedCharacters": ["andrew", "jewel"],
    "linkedEpisodes": ["my-lucky-charm"],
    "linkedLore": ["the-shire"],
    "updatedAt": "2025-01-15T12:00:00Z"
  },
  "message": "Links added successfully",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

### DELETE /api/prompts/:id/link

Remove links from characters, episodes, or lore.

**Authentication:** Required (admin or moderator role)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Prompt ID |

**Request Body:** Same as POST /link

**Example Request:**

```bash
DELETE /api/prompts/andrew-golden-hour/link
Content-Type: application/json

{
  "characters": ["jewel"],
  "episodes": []
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "andrew-golden-hour",
    "linkedCharacters": ["andrew"],
    "linkedEpisodes": ["my-lucky-charm"],
    "linkedLore": ["the-shire"],
    "updatedAt": "2025-01-15T12:00:00Z"
  },
  "message": "Links removed successfully",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request

Missing required fields or invalid data.

```json
{
  "success": false,
  "error": "Missing required fields",
  "required": ["id", "title", "content"]
}
```

### 401 Unauthorized

Authentication required but not provided.

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden

Insufficient permissions for the operation.

```json
{
  "success": false,
  "error": "Admin or moderator role required"
}
```

### 404 Not Found

Resource not found.

```json
{
  "success": false,
  "error": "Prompt not found",
  "id": "non-existent-id"
}
```

### 409 Conflict

Resource already exists.

```json
{
  "success": false,
  "error": "Prompt already exists",
  "id": "existing-id"
}
```

### 500 Internal Server Error

Server error occurred.

```json
{
  "success": false,
  "error": "Failed to fetch prompts",
  "message": "Database connection error"
}
```

---

## Usage Examples

### JavaScript/Fetch

```javascript
// Get all character prompts
const response = await fetch('/api/prompts?category=character');
const data = await response.json();
console.log(data.data); // Array of prompts

// Create a new prompt (requires auth)
const newPrompt = await fetch('/api/prompts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    id: 'new-prompt',
    title: 'New Prompt',
    content: 'Prompt content...',
    category: 'character'
  })
});

// Update a prompt
const updated = await fetch('/api/prompts/my-prompt', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    title: 'Updated Title'
  })
});

// Delete a prompt (soft delete)
await fetch('/api/prompts/my-prompt', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

### cURL

```bash
# Get all prompts
curl http://localhost:3001/api/prompts

# Get specific prompt
curl http://localhost:3001/api/prompts/andrew-golden-hour

# Create prompt (with auth)
curl -X POST http://localhost:3001/api/prompts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id": "new-prompt",
    "title": "New Prompt",
    "content": "Content here..."
  }'

# Update prompt
curl -X PUT http://localhost:3001/api/prompts/new-prompt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "Updated Title"}'

# Delete prompt
curl -X DELETE http://localhost:3001/api/prompts/new-prompt \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Rate Limiting

API endpoints may be subject to rate limiting to prevent abuse. Default limits:

- **Public endpoints (GET):** 100 requests per minute
- **Authenticated endpoints (POST/PUT/DELETE):** 30 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

---

## Best Practices

1. **Use Filtering:** Use query parameters to filter results instead of fetching all prompts
2. **Cache Results:** Cache prompt data on the client side when appropriate
3. **Soft Delete:** Use soft delete (default) instead of hard delete to maintain data integrity
4. **Batch Operations:** When adding multiple links, include them in a single request
5. **Version Tracking:** Check the `version` field when updating to detect conflicts
6. **Error Handling:** Always handle error responses appropriately

---

## See Also

- [PROMPT_SYSTEM.md](./PROMPT_SYSTEM.md) - Complete system documentation
- [PROMPT_SCRIPTS.md](./PROMPT_SCRIPTS.md) - CLI tools and scripts
- [helpers/prompt-helpers.js](../helpers/prompt-helpers.js) - Helper functions
- [routes/promptApi.js](../routes/promptApi.js) - API implementation
