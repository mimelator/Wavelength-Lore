# WAVELENGTH App Runner Environment Sync

Clean npm CLI admin tool for synchronizing environment variables from `.env` files to AWS App Runner production service.

## Quick Start

```bash
# Preview changes (safe - shows what would change)
npm run admin:env-sync

# Apply changes to production
npm run admin:env-sync -- --apply

# Show help
npm run admin:env-sync -- --help
```

## Features

✅ **Safe Preview Mode** - Shows exactly what will change without applying  
✅ **Production Variable Filtering** - Only syncs whitelisted production variables  
✅ **Sensitive Value Masking** - Hides secrets/keys in output for security  
✅ **Change Detection** - Shows added, modified, removed, and unchanged variables  
✅ **Port Synchronization** - Automatically syncs PORT env var with ImageConfiguration.Port  
✅ **Error Handling** - Clear error messages and validation  

## Environment Files Used

- `.env` - Base environment variables
- `.env.production` - Production overrides (takes precedence)

## Required Environment Variables

```env
APPRUNNER_SERVICE_ARN=arn:aws:apprunner:us-east-1:account:service/wavelength-lore/xyz
ACCESS_KEY_ID=your-aws-access-key
SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
```

## Production Variables Whitelist

The tool only syncs variables that are explicitly whitelisted for production:

### Core Application
- `NODE_ENV`, `PORT`, `SITE_URL`, `CDN_URL`, `VERSION`, `DEPLOYMENT_TIMESTAMP`

### Firebase Configuration  
- `API_KEY`, `AUTH_DOMAIN`, `DATABASE_URL`, `PROJECT_ID`, `STORAGE_BUCKET`
- `MESSAGING_SENDER_ID`, `APP_ID`, `MEASUREMENT_ID`, `FIREBASE_SERVICE_ACCOUNT`

### AWS Configuration
- `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`, `AWS_REGION`
- `APPRUNNER_SERVICE_ARN`

### Gallery & Storage
- `GALLERY_S3_BUCKET`, `GALLERY_CDN_URL`
- `CLOUDFRONT_DISTRIBUTION_ID`, `GALLERY_CLOUDFRONT_DISTRIBUTION_ID`

### External APIs
- `YOUTUBE_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`
- `AI_MODEL_KEY`, `AI_PROVIDER`, `VIDEO_MODEL_KEY`

### VIP Features
- `CHATBOT_JWT_SECRET`, `CHATBOT_API_URL`

### Merchandise (Printify & Stripe)
- `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID`, `PRINTIFY_API_URL`
- `PRINTIFY_ENVIRONMENT`, `PRINTIFY_MOCK_MODE`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_ENVIRONMENT`

### Security & Admin
- `ADMIN_SECRET_KEY`, `ADMIN_ALLOWED_IPS`
- `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX_REQUESTS`
- `SANITIZATION_ENABLED`, `PROFANITY_FILTER_ENABLED`

### File Uploads
- `FORUM_ATTACHMENTS_BUCKET`, `MAX_FILE_SIZE`, `MAX_FILES_PER_POST`
- `ALLOWED_FILE_TYPES`

### Backup Configuration
- `ENABLE_BACKUPS`, `BACKUP_S3_BUCKET`, `BACKUP_S3_REGION`
- `BACKUP_RETENTION_DAYS`, `BACKUP_COMPRESSION`, `BACKUP_ENCRYPTION`
- Plus other backup-related variables

## Usage Examples

### Check Current Status
```bash
npm run admin:env-sync
```
Output:
```
✅ Loaded 15 variables from .env
✅ Loaded 8 variables from .env.production  
✅ Selected 45 production variables
🔍 Environment Variables Changes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Added (2):
   + NEW_FEATURE_FLAG = true
   + STRIPE_WEBHOOK_SECRET = sk_te...abcd

🔄 Modified (1):
   ~ API_VERSION: v1.0 → v1.1

📊 Total Changes: 3
📊 Unchanged: 42

💡 To apply these changes, run:
   npm run admin:env-sync -- --apply
```

### Apply Changes
```bash
npm run admin:env-sync -- --apply
```
Output:
```
🚀 Updating App Runner service...
📋 Service: arn:aws:apprunner:us-east-1:account:service/wavelength-lore/xyz
🔧 Variables: 45
🔌 Port: 8080

✅ Service update initiated successfully!
📋 Operation ID: abc123-def456-ghi789
🔄 Status: OPERATION_IN_PROGRESS

📝 Next Steps:
   • Monitor deployment in AWS App Runner console
   • Verify application starts correctly  
   • Test critical functionality
```

## Safety Features

- **Preview First**: Always shows changes before applying
- **Whitelist Only**: Only syncs explicitly approved production variables
- **Sensitive Masking**: API keys/secrets shown as `sk_te...abcd` format
- **Error Validation**: Checks for required environment variables
- **No Destructive Actions**: Only updates environment variables (no service deletion)

## Integration with Existing Workflow

This tool integrates seamlessly with your existing admin workflow:

1. **Update Environment Files**: Edit `.env` or `.env.production`
2. **Preview Changes**: `npm run admin:env-sync`
3. **Apply Changes**: `npm run admin:env-sync -- --apply`
4. **Monitor Deployment**: Check AWS App Runner console
5. **Verify Application**: Test that the service starts correctly

## Troubleshooting

### "APPRUNNER_SERVICE_ARN environment variable is required"
Ensure your `.env` file contains:
```env
APPRUNNER_SERVICE_ARN=arn:aws:apprunner:us-east-1:your-account:service/wavelength-lore/your-service-id
```

### "Failed to get service configuration"
Check your AWS credentials and permissions:
```env
ACCESS_KEY_ID=your-access-key
SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Variables Not Syncing
Check that the variable is in the production whitelist. If you need to add a new production variable, edit the `productionVars` array in `apprunner-env-sync.js`.

## File Location

- **Script**: `scripts/unified/apprunner-env-sync.js`
- **NPM Command**: `admin:env-sync` (in package.json)
- **Documentation**: This file

## Related Tools

- `npm run cli:admin` - Main admin CLI tool
- `npm run cli:sync` - Asset synchronization
- `npm run cli:status` - Deployment status check