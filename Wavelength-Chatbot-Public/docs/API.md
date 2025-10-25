# Wavelength Chatbot API

## Authentication

All requests require an API key:

```javascript
headers: {
  'X-API-Key': 'your_public_api_key_here'
}
```

## Endpoints

### POST /chat
Send a chat message and receive AI response.

**Request:**
```json
{
  "message": "Hello, tell me about Wavelength Lore",
  "context": "optional_conversation_context"
}
```

**Response:**
```json
{
  "response": "AI response message",
  "conversationId": "unique_conversation_id",
  "timestamp": "2025-10-25T10:30:00Z"
}
```

### GET /preview/{type}/{id}
Get preview information for Wavelength Lore content.

**Parameters:**
- `type`: Content type (character, lore, episode)
- `id`: Content identifier

## Rate Limits

- 20 requests per minute per IP
- 200 requests per hour per API key
- Burst limit: 5 requests per second

## Error Codes

- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Invalid API key
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error
