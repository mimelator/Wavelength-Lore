# Rate Limiting Configuration Documentation

## 🛡️ **Overview**

The Wavelength Lore application implements comprehensive rate limiting to protect against abuse, spam, and DDoS attacks while maintaining excellent user experience. The system uses intelligent endpoint detection to apply appropriate limits based on the type of operation being performed.

## 📋 **Rate Limiting Summary**

| Endpoint Type | Requests | Time Window | Reset Time | Purpose |
|---------------|----------|-------------|------------|---------|
| **Forum Posts** | 5 | 15 minutes | 15 min | Prevent spam posting |
| **Forum Replies** | 10 | 10 minutes | 10 min | Allow conversation flow |
| **Forum Likes** | 20 | 5 minutes | 5 min | Prevent spam clicking |
| **Authentication** | 10 | 15 minutes | 15 min | Prevent brute force attacks |
| **API Endpoints** | 50 | 10 minutes | 10 min | Protect data access |
| **Admin Operations** | 5 | 1 hour | 60 min | Strict admin protection |
| **Static Content** | 200 | 5 minutes | 5 min | Allow normal browsing |
| **General Pages** | 100 | 15 minutes | 15 min | Standard page protection |

## 🎯 **Endpoint Classification**

### **Admin Operations** (Most Restrictive - 5/hour)
- `/admin/*` - Admin panel access
- `/manage/*` - Management operations
- `POST /api/cache/bust` - Cache management

**Rationale**: Admin operations are powerful and should be heavily restricted to prevent abuse.

### **Authentication** (Strict - 10/15min)
- `/auth/*` - Authentication endpoints
- `/login` - User login
- `/register` - User registration

**Rationale**: Prevents brute force attacks and credential stuffing.

### **Forum Posts** (Restrictive - 5/15min)
- `POST /api/forum/posts` - Creating new posts

**Rationale**: Prevents spam posting while allowing thoughtful discussion.

### **Forum Replies** (Moderate - 10/10min)
- `POST /api/forum/replies` - Creating replies

**Rationale**: More lenient than posts to allow conversation flow.

### **Forum Likes** (Lenient - 20/5min)
- `POST /*/like` - Liking posts/replies
- `POST /*/unlike` - Unliking posts/replies

**Rationale**: Quick actions that should be relatively unrestricted.

### **API Endpoints** (Moderate - 50/10min)
- `/api/*` - General API access
- Excludes admin and forum-specific endpoints

**Rationale**: Protects backend services while allowing normal application usage.

### **Static Content** (Very Lenient - 200/5min)
- `*.css` - Stylesheets
- `*.js` - JavaScript files
- `*.png`, `*.jpg`, `*.svg` - Images
- `*.ico` - Icons

**Rationale**: Static assets need high limits for normal page loading.

### **General Pages** (Default - 100/15min)
- All other endpoints not specifically classified
- Character pages, lore pages, episode pages

**Rationale**: Reasonable protection without impacting normal browsing.

## 🔧 **Implementation Details**

### **Smart Rate Limiting Middleware**

The system uses a smart middleware function that automatically detects endpoint types based on URL patterns and HTTP methods:

```javascript
// Example detection logic
if (path.includes('/admin') || path.includes('/manage')) {
  rateLimit = rateLimitConfigs.admin;
} else if (path.includes('/auth') || path.includes('/login')) {
  rateLimit = rateLimitConfigs.auth;
} else if (path.includes('/api/forum/posts') && method === 'post') {
  rateLimit = rateLimitConfigs.forumPosts;
}
```

### **Rate Limit Headers**

All responses include standard rate limiting headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Time when the rate limit resets

### **Error Responses**

When rate limits are exceeded, the system returns:
- **Status Code**: 429 (Too Many Requests)
- **Clear Error Message**: Explains what happened and when to retry
- **Retry Information**: Specific timeframes for different endpoints

## 📊 **Rate Limiting Policies**

### **Escalating Restrictions**

The rate limiting follows an escalating restriction model:

1. **High Volume, Low Risk**: Static content (200/5min)
2. **Normal Usage**: General pages (100/15min)
3. **API Protection**: Backend services (50/10min)
4. **User Actions**: Forum interactions (5-20 requests)
5. **Security Critical**: Authentication (10/15min)
6. **Administrative**: Admin operations (5/hour)

### **Time Windows**

Different time windows are used based on the expected usage patterns:

- **5 minutes**: Quick actions (likes, static content)
- **10 minutes**: Moderate interactions (replies, API calls)
- **15 minutes**: Standard protection (posts, auth, general)
- **1 hour**: Administrative operations

## 🚫 **Rate Limit Violations**

### **Error Messages by Endpoint Type**

**General/API Endpoints:**
```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": "15 minutes"
}
```

**Forum Posts:**
```json
{
  "error": "Too many posts",
  "message": "You can only create 5 posts every 15 minutes. Please wait before posting again.",
  "retryAfter": "15 minutes"
}
```

**Admin Operations:**
```json
{
  "error": "Too many admin operations",
  "message": "You have exceeded the admin operation limit. Please wait 1 hour before trying again.",
  "retryAfter": "1 hour"
}
```

### **Logging**

All rate limit violations are logged with:
- IP address of the requester
- Endpoint that was accessed
- Timestamp of the violation
- Type of rate limit that was exceeded

Example log output:
```
🚫 Admin rate limit exceeded for IP: 192.168.1.100 on /api/cache/bust
🚫 Forum post rate limit exceeded for IP: 10.0.0.50
```

## 🔍 **Monitoring and Analytics**

### **Rate Limit Metrics**

The system tracks:
- Number of requests per endpoint type
- Rate limit violations by IP and endpoint
- Peak usage patterns
- Effectiveness of different rate limits

### **Recommended Monitoring**

1. **High Violation Rates**: May indicate attack or misconfigured limits
2. **Low API Usage**: Could suggest limits are too restrictive
3. **Spike Patterns**: Help identify normal vs. abnormal traffic

## ⚙️ **Configuration Management**

### **Adjusting Rate Limits**

To modify rate limits, edit `/middleware/rateLimiting.js`:

```javascript
// Example: Increase forum post limit
forumPosts: rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Changed from 5 to 10
  // ... rest of configuration
})
```

### **Adding New Endpoint Types**

1. Add new rate limit configuration in `rateLimitConfigs`
2. Update the smart middleware detection logic
3. Add appropriate error messages
4. Test the new configuration

### **Temporary Adjustments**

For events or special circumstances, rate limits can be temporarily adjusted:

```javascript
// Temporarily increase limits for special events
const eventMode = process.env.EVENT_MODE === 'true';
const forumPostLimit = eventMode ? 10 : 5;
```

## 🧪 **Testing Rate Limits**

### **Test Scripts Available**

1. **`test-rate-limiting.js`**: Comprehensive test suite
2. **`quick-rate-limit-test.js`**: Quick admin/API testing
3. **`verify-firebase-security.js`**: Security verification

### **Manual Testing**

Use tools like `curl` or `postman` to test specific endpoints:

```bash
# Test admin endpoint
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/cache/bust \
    -H "Content-Type: application/json" \
    -d '{"type":"characters"}'
done
```

## 🔐 **Security Considerations**

### **IP-Based Limiting**

- Rate limits are applied per IP address
- Shared IPs (offices, schools) may hit limits faster
- Consider implementing user-based limiting for authenticated requests

### **Bypassing Rate Limits**

Rate limits can be bypassed by:
- Using multiple IP addresses
- Distributed attacks
- Legitimate high-traffic scenarios

### **Additional Security Layers**

Rate limiting works best when combined with:
- CAPTCHA for suspicious activity
- Account lockouts for repeated violations
- WAF (Web Application Firewall) for DDoS protection
- Content filtering for spam detection

## 📝 **Best Practices**

### **For Developers**

1. **Monitor Usage Patterns**: Regularly review rate limit metrics
2. **User Communication**: Provide clear error messages
3. **Graceful Degradation**: Handle rate limit errors in frontend
4. **Testing**: Always test rate limits in staging environment

### **For Users**

1. **Respect Limits**: Don't attempt to circumvent rate limiting
2. **Report Issues**: Contact support if limits seem too restrictive
3. **Batch Operations**: Group similar requests when possible

## 🚀 **Future Enhancements**

### **Planned Improvements**

1. **User-Based Limiting**: Rate limits per authenticated user
2. **Dynamic Limits**: Adjust based on server load
3. **Whitelist Support**: Exempt trusted IPs/users
4. **Advanced Analytics**: More detailed usage reporting
5. **Redis Integration**: Distributed rate limiting for multiple servers

### **Configuration Options**

Future versions may include:
- Environment-based rate limit profiles
- Time-of-day adjustments
- Geographic rate limiting
- Bot detection integration

---

## 📞 **Support and Troubleshooting**

### **Common Issues**

**Q: Users hitting rate limits during normal usage**
A: Review usage patterns and consider increasing limits for affected endpoints

**Q: Rate limits not working**
A: Check middleware order and ensure rate limiting is applied before routes

**Q: High memory usage**
A: Consider using Redis for rate limit storage in production

### **Contact Information**

For questions about rate limiting configuration:
- Check server logs for rate limit violations
- Review this documentation
- Test with the provided test scripts
- Monitor rate limit headers in responses

---

*Last Updated: October 17, 2025*
*Rate Limiting System Version: 1.0*