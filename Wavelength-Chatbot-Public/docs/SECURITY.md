# Security Guidelines

## API Key Management

### Public API Keys
- Use public API keys for frontend applications
- These keys have limited permissions (chat and preview only)
- Safe to include in client-side code

### Environment Variables
```bash
# Production
CHATBOT_API_KEY=your_public_api_key_here
CHATBOT_API_URL=your_firebase_function_url

# Development
CHATBOT_API_KEY=your_dev_api_key_here
CHATBOT_API_URL=http://localhost:5001/your-project/us-central1
```

## CORS Configuration

Ensure your Firebase Functions allow requests from your domain:

```javascript
// In your Firebase Functions
const cors = require('cors')({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ]
});
```

## Rate Limiting

The chatbot includes built-in rate limiting:
- 20 requests per minute per IP address
- 200 requests per hour per API key
- Implement client-side throttling for better user experience

## Content Security Policy

Add CSP headers to your website:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               connect-src 'self' https://your-firebase-functions-url;
               script-src 'self' 'unsafe-inline';">
```

## Best Practices

1. **Never commit secrets** to version control
2. **Use HTTPS** for all API requests
3. **Validate inputs** on both client and server
4. **Monitor API usage** for unusual patterns
5. **Rotate API keys** regularly (quarterly)

## Reporting Security Issues

If you discover a security vulnerability, please contact us at:
security@wavelengthlore.com
