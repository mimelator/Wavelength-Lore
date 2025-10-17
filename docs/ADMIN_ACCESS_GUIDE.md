# Admin Access Guide

## Authentication Required

All admin endpoints require authentication with the admin secret key.

### Admin Secret Key
```
[REDACTED - See .env file for actual key]
```

## Firebase Admin SDK Integration

The admin system now uses Firebase Admin SDK for secure database operations:

- **Service Account Authentication**: Uses `firebaseServiceAccountKey.json` for server-side Firebase access
- **Security Rule Bypass**: Admin SDK operations bypass client-side security rules legitimately
- **Full Database Access**: Can read/write all forum data including users, posts, and reports
- **Audit Logging**: All admin operations are logged with timestamps and details

## Admin Panel Access

### Forum Administration Dashboard
Access the comprehensive admin panel via web browser:

```
http://localhost:3001/forum/admin?adminKey=YOUR_ADMIN_KEY_HERE
```

**Features:**
- **Users Management**: View, edit roles, ban/unban users
- **Post Moderation**: View, edit, delete posts and replies
- **Reports System**: Handle user reports and content moderation
- **Settings Panel**: Configure forum settings and moderation rules
- **Real-time Data**: All data loaded via authenticated Firebase Admin API
- **Consistent Styling**: Uses the site's AnimeAce font and visual theme

### Visual Design
The admin panel now matches the main site's design language:
- **Typography**: Uses AnimeAce font family throughout the interface
- **Color Scheme**: Consistent with main site (white backgrounds, dark borders)
- **Layout**: Section-based design with proper borders and shadows
- **Form Elements**: Styled to match site buttons and inputs
- **Tables**: Clean, readable data presentation with hover effects

### Admin Panel Features

#### Users Tab
- View all registered users with avatars, roles, and activity
- Filter by role (admin, moderator, user, banned)
- Search by name or email
- Edit user roles (admin, moderator, user, banned)
- Ban/unban user accounts
- View user statistics (post count, join date, last activity)

#### Posts Tab  
- View all forum posts with titles, authors, and metadata
- Filter by category and search content
- Edit post titles and content
- Delete inappropriate posts
- Lock posts to prevent replies
- View post engagement (replies, likes)

#### Reports Tab
- View all user-submitted reports
- Filter by status (pending, resolved)
- Review reported content
- Resolve or dismiss reports
- Track moderation history

#### Settings Tab
- Configure auto-moderation settings
- Set content approval requirements
- Adjust post length limits
- Manage registration settings
- Email verification options

## Authentication Methods

### Method 1: HTTP Headers (Recommended)
```bash
# Basic admin operations
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/cache/bust

# Critical operations require additional header
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     -H "X-Admin-Critical: confirmed" \
     http://localhost:3001/api/admin/backup/status
```

### Method 2: Query Parameter
```bash
curl "http://localhost:3001/api/cache/bust?adminKey=YOUR_ADMIN_KEY_HERE"
```

## Protected Endpoints

### Forum Admin API Endpoints (New)
- `GET /api/admin/users` - Fetch all forum users with admin privileges
- `GET /api/admin/posts` - Fetch all forum posts with admin privileges  
- `GET /api/admin/reports` - Fetch all user reports with admin privileges
- `GET /api/admin/stats` - Get dashboard statistics (user/post/report counts)
- `POST /api/admin/users/:uid/update` - Update user data (role changes, etc.)
- `POST /api/admin/posts/:id/update` - Update post data (title, content, etc.)
- `DELETE /api/admin/posts/:id` - Delete posts with admin privileges

### Basic Admin Endpoints (admin key only)
- `GET /api/cache/bust` - View cache status
- `POST /api/cache/bust` - Clear all caches
- `GET /api/cache/bust/:type` - Clear specific cache
- `GET /api/admin/security/health` - Security system health
- `GET /api/admin/security/logs` - View security audit logs

### Critical Admin Endpoints (admin key + X-Admin-Critical: confirmed)
- `GET /api/admin/backup/status` - Backup system status
- `POST /api/admin/backup/create` - Create new backup
- `GET /api/admin/backup/list` - List available backups
- `GET /api/admin/backup/download/:filename` - Download backup
- `GET /forum/admin` - Forum administration panel

## Security Features

### Rate Limiting
- **50 admin operations per 15 minutes** per IP
- Exceeding limit returns `429 Too Many Requests`

### IP Allowlist
- Currently: `*` (allow all - for testing)
- Production: Configure specific IPs in `.env`
- Example: `ADMIN_ALLOWED_IPS=127.0.0.1,192.168.1.100,10.0.0.5`

### Audit Logging
- All admin access attempts logged
- Failed authentication tracked
- IP addresses, timestamps, and endpoints recorded

## Example Commands

### Forum Admin API Usage
```bash
# Get all users
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/admin/users

# Get all posts  
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/admin/posts

# Get all reports
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/admin/reports

# Get dashboard statistics
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/admin/stats

# Update user role
curl -X POST \
     -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     -H "Content-Type: application/json" \
     -d '{"role": "moderator"}' \
     http://localhost:3001/api/admin/users/USER_UID_HERE/update

# Update post title
curl -X POST \
     -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     -H "Content-Type: application/json" \
     -d '{"title": "New Post Title"}' \
     http://localhost:3001/api/admin/posts/POST_ID_HERE/update

# Delete a post
curl -X DELETE \
     -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/admin/posts/POST_ID_HERE
```

### Cache Management
```bash
# View cache status
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/cache/bust

# Clear all caches
curl -X POST \
     -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/cache/bust

# Clear character cache only
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/cache/bust/characters
```

### Backup Management
```bash
# Check backup system status
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     -H "X-Admin-Critical: confirmed" \
     http://localhost:3001/api/admin/backup/status

# List available backups
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     -H "X-Admin-Critical: confirmed" \
     http://localhost:3001/api/admin/backup/list

# Create new backup
curl -X POST \
     -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     -H "X-Admin-Critical: confirmed" \
     -H "Content-Type: application/json" \
     -d '{"type": "manual", "description": "Manual backup before updates"}' \
     http://localhost:3001/api/admin/backup/create
```

### Security Monitoring
```bash
# Check security system health
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/admin/security/health

# View security audit logs
curl -H "X-Admin-Key: YOUR_ADMIN_KEY_HERE" \
     http://localhost:3001/api/admin/security/logs
```

## Error Responses

### Authentication System Error  
```json
{
  "success": false,
  "error": "Authentication system error",
  "timestamp": "2025-10-17T20:30:58.221Z"
}
```

### Unauthorized (no admin key)
```json
{
  "success": false,
  "error": "Unauthorized: Admin key required",
  "hint": "Include X-Admin-Key header or adminKey query parameter",
  "timestamp": "2025-10-17T20:30:58.221Z"
}
```

### Invalid Admin Key
```json
{
  "success": false,
  "error": "Unauthorized: Invalid admin key",
  "timestamp": "2025-10-17T20:30:58.221Z"
}
```

### Firebase Admin API Errors
```json
{
  "success": false,
  "error": "Failed to fetch users data",
  "message": "Detailed error message from Firebase Admin SDK",
  "timestamp": "2025-10-17T20:30:58.221Z"
}
```

### Missing Critical Header
```json
{
  "success": false,
  "error": "Critical operation requires additional confirmation",
  "hint": "Include X-Admin-Critical: confirmed header",
  "timestamp": "2025-10-17T20:30:58.221Z"
}
```

### Rate Limit Exceeded
```json
{
  "error": "Too many admin operations",
  "message": "You have exceeded the admin operation limit. Please wait 15 minutes before trying again.",
  "retryAfter": "2025-10-17T20:45:58.221Z"
}
```

### IP Not Authorized
```json
{
  "success": false,
  "error": "Access forbidden: IP address not authorized",
  "timestamp": "2025-10-17T20:30:58.221Z"
}
```

## Production Security Notes

1. **Change Admin Key**: Generate a new secure key for production
2. **Configure IP Allowlist**: Set specific trusted IP addresses
3. **Monitor Logs**: Regularly check security audit logs
4. **Rotate Keys**: Periodically change admin authentication keys
5. **Use HTTPS**: Always use HTTPS in production environments
6. **Firebase Service Account**: Secure the `firebaseServiceAccountKey.json` file
7. **Database Security**: Firebase Admin SDK bypasses security rules - use responsibly
8. **Admin Panel Access**: Only share admin key with trusted administrators

## Troubleshooting

### Admin Panel Not Loading Data
1. **Check Admin Key**: Ensure you're using the correct key from `.env` file
2. **Verify Firebase Admin**: Check server logs for Firebase Admin SDK initialization
3. **Service Account**: Ensure `firebaseServiceAccountKey.json` exists and is valid
4. **API Endpoints**: Test individual API endpoints with curl/Postman
5. **Browser Console**: Check for JavaScript errors in browser developer tools

### Common Issues

**"Authentication system error"**: Usually indicates the admin key is incorrect or missing

**"Firebase Admin initialization failed"**: Check that `firebaseServiceAccountKey.json` is present and valid

**Empty data arrays**: Normal if no users/posts/reports exist yet in the database

**CORS errors**: Admin panel should be served from same domain as API

### Debug Commands
```bash
# Test admin key validation
curl -v "http://localhost:3001/api/admin/stats?adminKey=YOUR_KEY"

# Check server logs for Firebase Admin initialization
tail -f server.log | grep "Firebase Admin"

# Verify service account file exists
ls -la firebaseServiceAccountKey.json
```