# Wavelength Lore Scripts

This directory contains utility scripts, build tools, and maintenance scripts for the Wavelength Lore application.

## 📁 Script Categories

### 🔧 Build & Development Scripts
- **`start-dev.sh`** - Start development server with hot reload
- **`stop-dev.sh`** - Stop development server and clean up processes
- **`bust-cache.js`** - Clear application caches and regenerate cache-busted assets
- **`bust-cache.sh`** - Shell script version of cache busting (local + CloudFront)
- **`cloudfront-cache-bust.js`** - CloudFront CDN cache invalidation utility
- **`sync-assets.sh`** - Synchronize static assets across environments

### 🗄️ Database & Setup Scripts  
- **`populate_firebase.js`** - Initialize Firebase database with default data
- **`setup_forum_database.js`** - Set up forum database structure and initial data
- **`update_firebase_rules.js`** - Deploy updated Firebase security rules

### 💾 Backup & Maintenance Scripts
- **`backup-cli.js`** - Command-line interface for database backup operations
  - Initialize backup system
  - Create manual backups
  - List existing backups
  - Restore from backups
  - Test backup functionality

### 🚀 Deployment & Environment Scripts
- **`apprunner-env-updater.js`** - Update AWS App Runner production environment variables
  - Sync local `.env` with production App Runner service
  - Preview changes before applying
  - Filter production-appropriate variables
  - Secure credential handling
- **`setup-apprunner-permissions.js`** - Generate IAM policies for App Runner access
- **`setup-cloudfront-permissions.js`** - Generate IAM policies for CloudFront cache invalidation
- **`aws-setup-helper.js`** - Helper for AWS CLI configuration and setup
- **`env-helper.js`** - Centralized environment variable management for scripts

### 🖼️ Content Management Scripts
- **`add_carousel_image.js`** - Add new images to the main site carousel
- **`add_episode_image.js`** - Add episode-specific images to episode carousels
- **`display_carousel_images.js`** - Display current carousel image configuration
- **`display_episode_carousel_images.js`** - Display episode-specific carousel images

### 🔍 Quality Assurance Scripts
- **`check_broken_images.js`** - Scan for broken or missing image links
- **`check_youtube_links.js`** - Verify YouTube video links and availability

## 🚀 Usage Examples

### Development Workflow
```bash
# Start development
./scripts/start-dev.sh

# Clear caches during development (local only)
./scripts/bust-cache.sh --local

# Clear all caches (local + CloudFront)
./scripts/bust-cache.sh

# Stop development
./scripts/stop-dev.sh
```

### Database Operations
```bash
# Initialize fresh database
node scripts/populate_firebase.js

# Set up forum structure
node scripts/setup_forum_database.js

# Update security rules
node scripts/update_firebase_rules.js
```

### Backup Operations
```bash
# Initialize backup system
node scripts/backup-cli.js init

# Create manual backup
node scripts/backup-cli.js backup

# List available backups
node scripts/backup-cli.js list

# Restore from backup
node scripts/backup-cli.js restore <backup-id>
```

### Production Deployment
```bash
# Preview environment changes for App Runner
node scripts/apprunner-env-updater.js

# Apply environment updates to production
node scripts/apprunner-env-updater.js --force

# Check environment configuration
node scripts/backup-cli.js env

# Setup App Runner permissions (first time only)
node scripts/setup-apprunner-permissions.js
```

### Content Management
```bash
# Add new carousel image
node scripts/add_carousel_image.js

# Check for broken images
node scripts/check_broken_images.js

# Verify YouTube links
node scripts/check_youtube_links.js
```

## 📋 Script Requirements

### Environment Configuration
Most scripts require proper environment configuration:
- **`.env`** file with Firebase credentials
- **`firebaseServiceAccountKey.json`** for admin operations
- **AWS credentials** for backup operations (S3)

### Dependencies
Scripts use the following main dependencies:
- **Firebase Admin SDK** - Database operations
- **AWS SDK** - Backup operations
- **Node.js built-ins** - File system, HTTP operations

## 🔒 Security Considerations

### Credential Management
- Never commit credentials to version control
- Use environment variables for sensitive data
- Rotate credentials regularly
- Limit script permissions to minimum required

### Production Usage
- Test scripts in development environment first
- Use read-only operations when possible
- Implement confirmation prompts for destructive operations
- Log all script executions in production

## 🛠️ Adding New Scripts

### Naming Convention
- Use descriptive, action-oriented names
- Include file extension (`.js` or `.sh`)
- Group related scripts with common prefixes

### Script Template
```javascript
#!/usr/bin/env node

/**
 * Script Name - Brief Description
 * Usage: node scripts/script-name.js [options]
 */

require('dotenv').config();

async function main() {
  try {
    // Script implementation
    console.log('✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

---

**Note**: Always test scripts in development before running in production environments.