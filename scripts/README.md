# Wavelength Lore Scripts

This directory contains utility scripts, build tools, and maintenance scripts for the Wavelength Lore application.

## 📁 Script Categories

### 🚀 Deployment & Monitoring Scripts
- **`apprunner-deploy-monitor.js`** - Force redeploy and monitor AWS App Runner deployment status with real-time progress tracking
- **`deploy.sh`** - Convenient wrapper script for deployment monitoring
- **`apprunner-env-updater.js`** - Update environment variables and trigger automatic redeploy
- **`production-port-diagnostic.js`** - Diagnose and fix port configuration issues in production
- **`check-production-env.js`** - Quick check of production environment variables

#### Deployment Monitor Features
The deployment monitor provides comprehensive deployment management with enterprise-grade monitoring:

- ⏱️ **Real-time status updates** every 30 seconds with live progress tracking
- 🎯 **Deployment lifecycle management** from initiation to completion
- ⏳ **Accurate timing metrics** with elapsed time tracking
- 🌐 **Automatic connectivity testing** with retry logic and health validation
- 📊 **Comprehensive service health reporting** including CPU/memory/scaling metrics
- 🔧 **Intelligent troubleshooting guidance** with specific recommendations
- 🛡️ **Graceful interruption handling** (Ctrl+C safe - deployment continues)
- 📈 **Production-ready monitoring** with detailed logging and error reporting

#### Port Configuration Management
Advanced port configuration system for production deployment reliability:

- **`NODE_PORT=3001`** - Internal Node.js application port (behind proxy)
- **`NGINX_PORT=8080`** - External Nginx proxy port (public interface)
- **`DEPLOYMENT_TIMESTAMP`** - Automatic deployment tracking and redeploy triggers
- **`CONTACT_EMAIL`** - Centralized contact configuration for forum functionality

#### Production Diagnostics
Comprehensive diagnostic tools for production environment troubleshooting:

- **Port Configuration Analysis** - Automatic detection of port mismatches and conflicts
- **Environment Variable Validation** - Verification of all required production settings
- **Service Health Monitoring** - Real-time status checks and connectivity validation
- **Deployment History Tracking** - Timestamp-based deployment audit trail

**Usage Examples:**
```bash
# Quick deployment with monitoring
./deploy.sh --reason "Fix production bug"

# Advanced deployment with custom reason
node apprunner-deploy-monitor.js --reason "Deploy port configuration fix"

# Environment variable updates with automatic redeploy
node apprunner-env-updater.js --force

# Production diagnostics and troubleshooting
node production-port-diagnostic.js --fix
node check-production-env.js

# Preview environment changes
node apprunner-env-updater.js --dry-run
```

#### Deployment Status Indicators
- 🟢 **RUNNING**: Service is healthy and ready for traffic
- 🟡 **DEPLOYING**: Deployment in progress with real-time monitoring
- 🔴 **FAILED**: Deployment failed with detailed error analysis
- ⏸️ **PAUSED**: Service paused (requires manual intervention)

#### Monitoring & Alerting Features
- **Real-time Progress Updates**: Live status updates every 30 seconds
- **Health Check Automation**: Post-deployment connectivity validation
- **Error Detection & Analysis**: Intelligent failure diagnosis
- **Deployment Metrics**: Comprehensive timing and performance data
- **Service Configuration Reporting**: CPU, memory, and auto-scaling status

#### Production Environment Variables
The deployment system manages these critical production settings:

**Port Configuration:**
- `NODE_PORT=3001` - Node.js internal port (Nginx proxy target)
- `NGINX_PORT=8080` - Nginx external port (public interface)

**Application Settings:**
- `CONTACT_EMAIL` - Forum contact email (dynamically configurable)
- `DEPLOYMENT_TIMESTAMP` - Deployment tracking and redeploy triggers
- `CDN_URL` - CloudFront CDN endpoint for static assets

**Database & Services:**
- Firebase configuration (API_KEY, DATABASE_URL, PROJECT_ID, etc.)
- AWS credentials and S3 bucket settings
- Security and rate limiting configurations

#### Troubleshooting Guide
Common issues and solutions:

**502 Bad Gateway Errors:**
1. Check port configuration: `node check-production-env.js`
2. Verify NODE_PORT=3001 and application startup
3. Run diagnostics: `node production-port-diagnostic.js --fix`

**Deployment Failures:**
1. Monitor deployment: `node apprunner-deploy-monitor.js`
2. Check service logs in AWS CloudWatch
3. Verify environment variables: `node apprunner-env-updater.js --dry-run`

**Environment Variable Issues:**
1. Update variables: `node apprunner-env-updater.js --force`
2. Verify changes: `node check-production-env.js`
3. Monitor redeploy: `node apprunner-deploy-monitor.js`

### �🔧 Build & Development Scripts
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
- **`cleanup-test-posts.js`** - Remove leftover test posts from e2e testing
  - Identifies test posts by title/author patterns
  - Cleans up associated S3 attachments
  - Removes test replies
  - Interactive confirmation with dry-run option
- **`check-forum-database.js`** - Quick overview of current forum database contents

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

# Clean up test data from e2e tests
node scripts/cleanup-test-posts.js

# Check current forum database contents
node scripts/check-forum-database.js
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

### Cache Management
```bash
# Clear all caches (local + CloudFront)
./scripts/bust-cache.sh

# Clear local caches only
./scripts/bust-cache.sh --local

# Clear CloudFront CDN only
./scripts/bust-cache.sh --cdn

# Clear specific cache types
./scripts/bust-cache.sh --local --characters
./scripts/bust-cache.sh --local --lore --refresh

# Direct CloudFront cache invalidation
node scripts/cloudfront-cache-bust.js
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