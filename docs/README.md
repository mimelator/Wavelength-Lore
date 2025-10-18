# Wavelength Lore Documentation

Welcome to the comprehensive documentation for the Wavelength Lore application. This directory contains all technical documentation, guides, and reference materials.

## 📚 Documentation Index

### 🔒 Security & Protection
- **[Security Enhancement Guide](SECURITY_ENHANCEMENT_GUIDE.md)** - Comprehensive security implementation guide covering Firebase, rate limiting, and input sanitization
- **[Security Incident Response](SECURITY_INCIDENT_RESPONSE.md)** - Emergency response procedures and security incident handling
- **[Rate Limiting Documentation](RATE_LIMITING_DOCUMENTATION.md)** - Smart rate limiting system configuration and usage

### 💾 Backup & Data Protection
- **[Database Backup Setup Guide](DATABASE_BACKUP_SETUP_GUIDE.md)** - Complete step-by-step setup and usage guide
- **[Backup Configuration](BACKUP_CONFIGURATION.md)** - Complete setup guide for automated S3 backups
- **[Backup Implementation Summary](BACKUP_IMPLEMENTATION_SUMMARY.md)** - Overview of the implemented backup system features

### 🚨 Disaster Recovery
- **[Disaster Recovery Guide](DISASTER_RECOVERY.md)** - Complete catastrophic failure recovery procedures
- **[Quick Recovery Checklist](QUICK_RECOVERY_CHECKLIST.md)** - Emergency reference for immediate disaster recovery

### 🎮 Application Features
- **[Character Reference System](CHARACTER_REFERENCE_SYSTEM.md)** - Character linking and disambiguation system
- **[Lore System Documentation](LORE_SYSTEM_DOCUMENTATION.md)** - Lore management and linking functionality
- **[Carousel Usage](CAROUSEL_USAGE.md)** - Image carousel implementation and usage
- **[Forum Delete Functionality](FORUM_DELETE_FUNCTIONALITY.md)** - User post/reply deletion with authentication and S3 cleanup
- **[Forum Category Guide](FORUM_CATEGORY_GUIDE.md)** - Complete guide for adding, modifying, and managing forum categories

### 🔧 Admin & Management
- **[Admin Access Guide](ADMIN_ACCESS_GUIDE.md)** - Admin panel access and API endpoints
- **[Firebase Admin Implementation](FIREBASE_ADMIN_IMPLEMENTATION.md)** - Firebase Admin SDK integration and usage

### ⚡ Performance & Optimization
- **[Cache Busting](CACHE_BUSTING.md)** - Static asset cache management and optimization

### 🛠️ Development & Debugging
- **[Node.js v24 Compatibility Fix](NODE_V24_COMPATIBILITY_FIX.md)** - Compatibility fixes for Node.js v24
- **[GitHub Action Monitor](GITHUB_ACTION_MONITOR.md)** - CI/CD pipeline monitoring and deployment tracking
- **[Deployment Troubleshooting](DEPLOYMENT_TROUBLESHOOTING.md)** - Comprehensive guide for ECR caching issues and production deployment problems
- **[Debug Scripts](../debug/README.md)** - Debug and diagnostic scripts for troubleshooting

### 📋 Implementation Plans
- **[Email Login Implementation Plan](EMAIL_LOGIN_IMPLEMENTATION_PLAN.md)** - Comprehensive plan for adding email/password authentication to the forum system

## 🚀 Quick Start Guides

### Security Setup
1. Review [Security Enhancement Guide](SECURITY_ENHANCEMENT_GUIDE.md)
2. Configure Firebase security rules
3. Set up rate limiting and input sanitization
4. Follow [Security Incident Response](SECURITY_INCIDENT_RESPONSE.md) procedures

### Backup Setup
1. Read [Backup Configuration](BACKUP_CONFIGURATION.md)
2. Configure AWS S3 credentials
3. Initialize backup system with `node backup-cli.js init`
4. Test backups with `node backup-cli.js test`

### Feature Implementation
1. Character system: [Character Reference System](CHARACTER_REFERENCE_SYSTEM.md)
2. Lore management: [Lore System Documentation](LORE_SYSTEM_DOCUMENTATION.md)
3. UI components: [Carousel Usage](CAROUSEL_USAGE.md)
4. Delete functionality: [Forum Delete Functionality](FORUM_DELETE_FUNCTIONALITY.md)
5. Admin operations: [Admin Access Guide](ADMIN_ACCESS_GUIDE.md)

### Deployment & Troubleshooting
1. For deployment issues: [Deployment Troubleshooting](DEPLOYMENT_TROUBLESHOOTING.md)
2. Monitor GitHub Actions: `node scripts/github-action-monitor.js --watch`
3. Force ECR deployment: `node scripts/update-ecr-tag.js`
4. Full pipeline monitoring: `node scripts/deployment-pipeline-monitor.js`

## 📋 Documentation Standards

### File Organization
- **Security**: All security-related documentation
- **Features**: Application functionality and usage guides
- **Technical**: Implementation details and API references
- **Setup**: Installation and configuration guides

### Naming Convention
- Use descriptive, uppercase titles with underscores
- Include file extensions (.md for markdown)
- Group related documents with common prefixes

### Content Structure
Each documentation file should include:
- Clear title and purpose
- Table of contents for longer documents
- Code examples with syntax highlighting
- Step-by-step instructions where applicable
- Troubleshooting sections
- Related document links

## 🔧 Maintenance

### Updating Documentation
1. Keep documentation current with code changes
2. Update version references when releasing
3. Review and update examples regularly
4. Maintain cross-references between documents

### Review Schedule
- **Security docs**: Review monthly or after security updates
- **Feature docs**: Review with each major feature release
- **Setup guides**: Review quarterly for accuracy

## 📞 Support

For questions about documentation or implementation:
1. Check the relevant documentation file first
2. Review related troubleshooting sections
3. Consult the Security Enhancement Guide for security questions
4. Check backup documentation for data protection issues

## 📈 Version History

- **v1.0** - Initial documentation structure
- **v1.1** - Added security enhancement guides
- **v1.2** - Added backup system documentation
- **v1.3** - Reorganized into centralized docs folder

---

*Last updated: October 17, 2025*