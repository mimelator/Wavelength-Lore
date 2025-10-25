# 🤖 Chatbot Integration Quick Reference

## Overview
The Wavelength-Lore website integrates with an external Firebase Functions-based chatbot service to provide VIP+ members with intelligent assistance about the Wavelength universe.

## Architecture Summary

```
Main Website (wavelengthlore.com) ◄──────► Firebase Functions Chatbot
         │                                   (us-central1-wavelength-lore.cloudfunctions.net)
         ├── VIP+ Authentication             │
         ├── Widget Integration (/chatbot/widget) ──► SSO Token Validation
         └── Session Management              └── AI Response Generation
```

## Key Components

### **Main Website Integration**
- **Widget Page**: `/chatbot/widget` - Chatbot interface container
- **SSO Widget**: `sso-chat-widget.js` - Client-side chat interface
- **Authentication**: VIP+ membership requirement with SSO tokens
- **Integration**: Iframe-based embedding with cross-origin support

### **External Chatbot Service**
- **Backend**: Firebase Functions with Node.js/Express
- **Database**: Pinecone vector database for lore storage
- **AI Engine**: OpenAI GPT-4 for intelligent responses
- **Authentication**: JWT-based SSO with session management

## API Endpoints

### **Production Firebase Functions**
- **Base URL**: `https://us-central1-wavelength-lore.cloudfunctions.net`
- **Health Check**: `GET /health` - Service status and configuration
- **Chat Endpoint**: `POST /chat` - Main chat functionality (VIP+ required)
- **Admin Panel**: `GET /admin` - Session management (admin only)
- **Legacy Support**: `POST /legacy` - API key-based access

### **Authentication Flow**
1. User authenticates on wavelengthlore.com
2. SSO token generated and stored in localStorage/cookies
3. Widget detects authentication and membership level
4. Token passed to Firebase Functions for validation
5. Chat interface activated for VIP+ users

## Security Model

### **Access Control**
- **VIP+ Requirement**: Only VIP+ members can access chatbot
- **SSO Integration**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and spam
- **Input Validation**: Sanitization and content filtering
- **Session Management**: JWT tokens with expiration

### **Response Codes**
- **200**: Successful chat response
- **401**: Authentication required or invalid token
- **403**: VIP+ membership required
- **429**: Rate limit exceeded
- **500**: Internal server error

## Testing & Validation

### **Test Suites Available**
- **Firebase Functions Test**: `tests/chatbot/firebase-chatbot-test.js`
- **Integration Validator**: `tests/chatbot/integration-validator.js`
- **API Endpoint Test**: `tests/chatbot/simple-api-test.js`
- **SSO Flow Test**: `tests/chatbot/sso-chatbot-test.js`

### **Health Check Commands**
```bash
# Test Firebase Functions health
node tests/chatbot/firebase-chatbot-test.js --headless

# Validate cross-system integration
node tests/chatbot/integration-validator.js

# Check API endpoints
node tests/chatbot/simple-api-test.js
```

## Implementation Notes

### **Widget Integration**
```javascript
// Widget automatically initializes on page load
// Detects authentication status and membership level
// Provides VIP+ access control with upgrade prompts

// Key classes:
// - SSOAuthManager: Handles authentication flow
// - SSOChatWidget: Main chat interface
// - Authentication detection via tokens/cookies
```

### **Development vs Production**
- **Development**: Localhost testing with mock authentication
- **Production**: Full SSO integration with VIP+ enforcement
- **Testing**: Comprehensive validation of all integration points

## Quick Troubleshooting

### **Common Issues**

| Issue | Cause | Solution |
|-------|--------|----------|
| 401 Authentication Error | No/invalid SSO token | Check user login status |
| 403 Access Denied | Non-VIP+ membership | Verify membership level |
| Widget not loading | iframe/CORS issues | Check browser console |
| Chat input not found | Widget not initialized | Allow page to fully load |
| 429 Rate Limited | Too many requests | Wait and retry |

### **Debug Tools**
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor API requests and responses
- **Local Storage**: Verify SSO token presence
- **Firebase Console**: Monitor function logs and errors

## Documentation Links

- **[Complete Architecture](WAVELENGTH_SYSTEM_ARCHITECTURE.md)** - Full system overview
- **[Chatbot Testing Summary](../tests/chatbot/CHATBOT_TESTING_SUMMARY.md)** - Validation results
- **[Firebase Functions Code](../../Wavelength-Chatbot/)** - Backend implementation
- **[Main Website Integration](../static/js/)** - Frontend integration code

## Status & Health

✅ **Production Ready**: Chatbot service operational and validated  
✅ **Security Verified**: VIP+ access control working correctly  
✅ **Integration Tested**: Cross-system communication functional  
✅ **Monitoring Active**: Health checks and error tracking enabled  

---

*Quick reference for the Wavelength-Lore external chatbot integration - providing VIP+ members with intelligent assistance about the Wavelength universe.*