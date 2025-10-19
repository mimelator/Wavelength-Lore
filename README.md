# Wavelength-Lore
The Lore Site for the Wavelength Canon

> **Status**: Testing ECR deployment workflow (credentials updated)

## 📚 Documentation

All project documentation has been organized in the [`docs/`](docs/) folder:

- **[📖 Documentation Index](docs/README.md)** - Complete documentation overview and navigation
- **[🔒 Security Guide](docs/SECURITY_ENHANCEMENT_GUIDE.md)** - Security implementation and best practices
- **[💾 Backup System](docs/BACKUP_CONFIGURATION.md)** - Automated database backup setup
- **[🎮 Features](docs/)** - Character system, lore management, and application features

## 🚀 Quick Start

1. **Setup**: Follow the [Security Enhancement Guide](docs/SECURITY_ENHANCEMENT_GUIDE.md)
2. **Backup**: Configure [Automated Backups](docs/BACKUP_CONFIGURATION.md)
3. **Features**: Explore [Application Documentation](docs/README.md)

## 🛡️ Security Features

- ✅ Firebase security rules with script token authentication
- ✅ Smart rate limiting with endpoint detection
- ✅ Input sanitization with XSS protection
- ✅ Automated encrypted backups to AWS S3
- ✅ User authentication with Firebase ID tokens
- ✅ Secure delete functionality with ownership verification

## 🔧 Asset Management & Validation

The site includes a comprehensive asset validation system to ensure all resources are working correctly:

### 📁 Resource Validation Suite
- ✅ **[Image Checker](scripts/RESOURCE_CHECKER_README.md#-image-checker-check_broken_imagesjs)**: Validates all images (img tags, backgrounds) with category analysis
- ✅ **[Static Resource Checker](scripts/RESOURCE_CHECKER_README.md#-static-resource-checker-check_static_resourcesjs)**: Tests CSS, JS, fonts, icons, and CDN resources
- ✅ **[Route Link Checker](scripts/RESOURCE_CHECKER_README.md#-route-link-checker-check_route_linksjs)**: Scans EJS templates for broken internal links with database validation

### 🚀 Production Validation
- ✅ **[Production Suite](scripts/PRODUCTION_VALIDATION_README.md)**: Unified validation system with Quick/Standard/Full modes
- ✅ **Environment Support**: Automatic detection between local (`localhost:3001`) and production (`wavelengthlore.com`)
- ✅ **CI/CD Integration**: Proper exit codes and timeout handling for automated pipelines
- ✅ **Smart Timeouts**: Optimized timeouts for local (5-10s) vs production (15-30s) environments

### 📊 Usage Examples
```bash
# Quick production health check (1-2 min)
./scripts/validate-production.sh quick

# Full comprehensive validation (5-10 min)  
./scripts/validate-production.sh full

# Individual component testing
node scripts/check_broken_images.js --prod
node scripts/check_static_resources.js --prod
node scripts/check_route_links.js --prod
```

See [Resource Checker Documentation](scripts/RESOURCE_CHECKER_README.md) and [Production Validation Guide](scripts/PRODUCTION_VALIDATION_README.md) for complete usage details.

## � Forum Features

The Wavelength Lore site includes a comprehensive community forum with:

### Core Functionality
- ✅ **Discussion Posts**: Create and participate in community discussions
- ✅ **Reply System**: Threaded replies with real-time updates
- ✅ **Search & Discovery**: Advanced search with filters and category support
- ✅ **Community Guidelines**: Comprehensive moderation policies and rules
- ✅ **Contact System**: Direct moderator contact with configurable email

### Content Management
- ✅ **Rich Text Support**: Markdown formatting and media attachments
- ✅ **File Attachments**: Secure S3 integration for images and documents
- ✅ **Content Categories**: Organized discussion topics and filtering
- ✅ **User Profiles**: Display user information and post history

### Moderation & Safety
- ✅ **Authenticated Deletion**: Secure post and reply removal with ownership verification
- ✅ **Admin Controls**: Administrative override capabilities for content management
- ✅ **Cascade Deletion**: Automatic cleanup of replies when posts are deleted
- ✅ **File Cleanup**: Automatic S3 attachment removal for deleted content
- ✅ **Rate Limiting**: Smart protection against spam and abuse

### Navigation & Discovery
- ✅ **Unified Navigation**: Consistent forum navigation across all pages
- ✅ **Search Integration**: Real-time search with category and content filtering
- ✅ **Guidelines Integration**: Easy access to community rules and policies
- ✅ **Help System**: Comprehensive user guides and support resources

See [Forum Delete Documentation](docs/FORUM_DELETE_FUNCTIONALITY.md) and [Security Enhancement Guide](docs/SECURITY_ENHANCEMENT_GUIDE.md) for implementation details.

See [Security Enhancement Guide](docs/SECURITY_ENHANCEMENT_GUIDE.md) for complete details.
