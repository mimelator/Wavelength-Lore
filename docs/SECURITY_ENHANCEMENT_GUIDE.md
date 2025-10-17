# Firebase Security Enhancement Guide

## 1. Environment Variables Protection

Ensure these environment variables are properly set:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

## 2. Rate Limiting Implementation

Add rate limiting to your Express app:
```javascript
const rateLimit = require('express-rate-limit');

const forumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for forum posts
  message: 'Too many posts created from this IP, please try again later.'
});

app.use('/api/forum', forumLimiter);
```

## 3. Input Sanitization

Add HTML sanitization for forum content:
```javascript
const DOMPurify = require('isomorphic-dompurify');

// Sanitize user input before saving to Firebase
const sanitizedContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
  ALLOWED_ATTR: []
});
```

## 4. Authentication Token Verification

Verify custom tokens in your scripts:
```javascript
const admin = require('firebase-admin');

// Create custom token for scripts
const customToken = await admin.auth().createCustomToken(uid, {
  isScript: true,
  scriptName: 'populate_firebase'
});
```

## 5. Monitoring and Logging

Set up Firebase Security Rules logging:
- Enable Firebase Rules debugging in console
- Monitor failed authentication attempts
- Track suspicious access patterns
- Log all admin operations

## 6. Content Moderation

Add automatic content filtering:
```javascript
const Filter = require('bad-words');
const filter = new Filter();

// Check for inappropriate content
if (filter.isProfane(content)) {
  throw new Error('Content contains inappropriate language');
}
```

## 7. Automated Database Backups

Secure automated backups to AWS S3:
```javascript
const SecureDatabaseBackup = require('./utils/secureBackup');

// Initialize backup system
const backup = new SecureDatabaseBackup({
  bucketName: 'wavelength-lore-backups',
  retentionDays: 30,
  encryptionEnabled: true
});

await backup.initialize();
```

### Backup Features:
- **Encryption**: AES-256-GCM encryption for sensitive data
- **Compression**: Gzip compression to reduce storage costs
- **Scheduling**: Automated daily and weekly backups
- **Retention**: Configurable retention with automatic cleanup
- **Monitoring**: Health checks and status reporting

### Configuration:
```bash
# Required environment variables
BACKUP_S3_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
BACKUP_ENCRYPTION_KEY=your-encryption-key
```

### CLI Management:
```bash
# Create backup
node backup-cli.js backup manual

# List backups
node backup-cli.js list

# Restore backup
node backup-cli.js restore backup-key
```

## 8. Content Moderation

Add automatic content filtering:
```javascript
const Filter = require('bad-words');
const filter = new Filter();

// Check for inappropriate content
if (filter.isProfane(content)) {
  throw new Error('Content contains inappropriate language');
}
```

## 9. Security Headers

Add security headers to your Express app:
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## 10. API Key Rotation

Regularly rotate your Firebase service account keys:
1. Generate new service account key in Firebase Console
2. Update environment variables
3. Restart application
4. Delete old service account key

## 11. User Session Management

Implement proper session handling:
```javascript
// Set session timeout
const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

// Verify token freshness
if (Date.now() - user.authTime > sessionTimeout) {
  // Force re-authentication
  await firebase.auth().signOut();
}
```