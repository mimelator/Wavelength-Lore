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

## 🗑️ Forum Delete Functionality

Users can now delete their own posts and replies with comprehensive security:

- **Authenticated Deletion**: Uses Firebase ID tokens for secure user verification
- **Ownership Verification**: Users can only delete their own content
- **Cascade Deletion**: Deleting posts automatically removes all replies
- **File Cleanup**: Automatically removes S3 attachments when content is deleted
- **Admin Override**: Administrators can delete any content through admin panel

See [Forum Delete Documentation](docs/FORUM_DELETE_FUNCTIONALITY.md) for complete implementation details.

See [Security Enhancement Guide](docs/SECURITY_ENHANCEMENT_GUIDE.md) for complete details.
