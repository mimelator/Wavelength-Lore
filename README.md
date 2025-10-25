# Wavelength-Lore
The Lore Site for the Wavelength Canon

> **Status**: Testing new pre-increment version deployment strategy 🚀

## 🛡️ Package.json Protection System

**✅ AUTOMATED PROTECTION ACTIVE**

**Comprehensive protection against package.json corruption with:**
- **Automated Backups**: Timestamped backups before risky operations
- **Integrity Validation**: Real-time corruption detection
- **Emergency Recovery**: Automatic git and backup-based restoration
- **Safe Script Execution**: Protected wrapper for all script operations

**Quick Commands:**
```bash
# Setup protection (one-time)
bash scripts/package-guard.sh auto-protect

# Daily usage
bash scripts/package-guard.sh backup          # Create backup
bash scripts/package-guard.sh safe-run <script>  # Run script safely
bash scripts/package-guard.sh status          # Check health
```

**Full Guide**: [🛡️ Package Protection System](docs/PACKAGE_PROTECTION_SYSTEM.md)

---

## 📚 Documentation

All project documentation has been organized in the [`docs/`](docs/) folder:

- **[🏗️ System Architecture](docs/WAVELENGTH_SYSTEM_ARCHITECTURE.md)** - Complete system architecture including external chatbot integration
- **[📖 Documentation Index](docs/README.md)** - Complete documentation overview and navigation
- **[🔒 Security Guide](docs/SECURITY_ENHANCEMENT_GUIDE.md)** - Security implementation and best practices
- **[💾 Backup System](docs/BACKUP_CONFIGURATION.md)** - Automated database backup setup
- **[🤖 Chatbot Integration](tests/chatbot/CHATBOT_TESTING_SUMMARY.md)** - Firebase Functions chatbot architecture and validation
- **[🎮 Features](docs/)** - Character system, lore management, and application features

## 🚀 Quick Start

1. **Setup**: Follow the [Security Enhancement Guide](docs/SECURITY_ENHANCEMENT_GUIDE.md)
2. **Backup**: Configure [Automated Backups](docs/BACKUP_CONFIGURATION.md)
3. **Features**: Explore [Application Documentation](docs/README.md)

## 🤖 AI Chatbot Integration

The Wavelength-Lore ecosystem includes an advanced external AI chatbot service that provides VIP+ members with intelligent assistance about the Wavelength universe:

### 🌟 **External Chatbot Service**
- ✅ **Firebase Functions Backend**: Serverless architecture at `us-central1-wavelength-lore.cloudfunctions.net`
- ✅ **SSO Integration**: Seamless authentication with main website using JWT tokens
- ✅ **VIP+ Exclusive Access**: Membership tier requirement for chatbot functionality
- ✅ **Vector Database Knowledge**: Complete lore stored in Pinecone for accurate responses
- ✅ **OpenAI GPT Integration**: Advanced AI responses about characters, stories, and universe details

### � **Integration Architecture**
- **Widget Integration**: Embedded chat widget on main website (`/chatbot/widget`)
- **Authentication Flow**: SSO token validation between main site and chatbot service
- **Session Management**: Persistent conversation history and context awareness
- **Health Monitoring**: Comprehensive testing suite validating all integration points

### 🚀 **Chatbot Features**
- **Lore Expertise**: Deep knowledge of Wavelength universe, characters, and storylines
- **Real-time Responses**: Interactive conversation with context awareness
- **Security Controls**: Rate limiting, input validation, and VIP+ access enforcement
- **Cross-Platform**: Accessible through main website with responsive design

See **[🤖 Chatbot Architecture Documentation](tests/chatbot/CHATBOT_TESTING_SUMMARY.md)** for complete technical details and validation results.

## �🛡️ Security Features

- ✅ Firebase security rules with script token authentication
- ✅ Smart rate limiting with endpoint detection
- ✅ Input sanitization with XSS protection
- ✅ Automated encrypted backups to AWS S3
- ✅ User authentication with Firebase ID tokens
- ✅ Secure delete functionality with ownership verification
- ✅ **External Chatbot Security**: VIP+ access control with SSO integration

## 🔧 Asset Management & Validation

The site includes a comprehensive asset validation system to ensure all resources are working correctly:

### 🚀 CDN & Storage Integration
- ✅ **CloudFront CDN**: Optimized content delivery through AWS CloudFront
- ✅ **S3 Storage**: Secure and scalable image storage with AWS S3
- ✅ **Gallery Feature**: User image uploads stored in S3 and served via CloudFront
- ✅ **CORS Support**: Cross-Origin Resource Sharing for external applications
- ✅ **Automated Testing**: CDN integration tests verify functionality

See [CDN Configuration Guide](docs/cdn-configuration-guide.md) for setup details.

### 📁 Resource Validation Suite
- ✅ **[Image Checker](docs/scripts/RESOURCE_CHECKER_README.md#-image-checker-check_broken_imagesjs)**: Validates all images (img tags, backgrounds) with category analysis
- ✅ **[Static Resource Checker](docs/scripts/RESOURCE_CHECKER_README.md#-static-resource-checker-check_static_resourcesjs)**: Tests CSS, JS, fonts, icons, and CDN resources
- ✅ **[Route Link Checker](docs/scripts/RESOURCE_CHECKER_README.md#-route-link-checker-check_route_linksjs)**: Scans EJS templates for broken internal links with database validation

### 🚀 Production Validation
- ✅ **[Production Suite](docs/scripts/PRODUCTION_VALIDATION_README.md)**: Unified validation system with Quick/Standard/Full modes
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

See [Resource Checker Documentation](docs/scripts/RESOURCE_CHECKER_README.md) and [Production Validation Guide](docs/scripts/PRODUCTION_VALIDATION_README.md) for complete usage details.

## 🎨 AI Image Generation

The site includes an advanced AI image generation system for creating custom artwork:

### 🤖 AI-Powered Content Creation
- ✅ **[AI Image Generator](docs/scripts/AI_IMAGE_GENERATION_README.md)**: Generate images from text prompts using Google's Imagen API
- ✅ **Character Portraits**: Automated character portrait generation with style presets
- ✅ **Location Scenes**: Epic fantasy landscape and environment generation
- ✅ **Asset Integration**: Automatic upload and optimization through enhanced asset manager
- ✅ **Multiple Variations**: Generate multiple variations of concepts for selection

### 🚀 Quick AI Generation
```bash
# Generate character portrait
./scripts/ai-image-generator.js character "Lucky" "mischievous leprechaun with green hat"

# Generate location scene  
./scripts/ai-image-generator.js location "Emerald Grove" "mystical forest with glowing trees"

# Generate and upload to assets automatically
./scripts/ai-image-generator.js workflow "magical crystal cave" "locations/crystal-cave"
```

### 🔧 AI Features
- ✅ **Smart Defaults**: Optimized settings for different content types
- ✅ **Style Presets**: Fantasy-art, photorealistic, anime, concept-art styles
- ✅ **Batch Generation**: Create multiple variations with single command
- ✅ **Asset Pipeline**: Seamless integration with asset management system
- ✅ **URL Flexibility**: Relative, CDN, or absolute URL generation modes

See [AI Image Generation Guide](docs/scripts/AI_IMAGE_GENERATION_README.md) for complete usage and examples.

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
# Pre-increment test completed successfully! Version incremented v1.0.175 → v1.0.176 before deployment.
