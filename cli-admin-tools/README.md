# 🌊 WAVELENGTH CLI ADMIN TOOLKIT

**Pristine, Isolated Admin Tools for Production Operations**

## 🎯 **Purpose**

This toolkit provides clean, reliable admin tools completely isolated from existing (potentially broken) scripts. Built specifically for the Wavelength CLI with production-grade reliability.

## 🛠️ **Available Tools**

### 📄 **Sync Assets** (`sync`)
- **Purpose**: Synchronize static assets and images
- **Features**: Directory validation, asset counting, timestamp tracking
- **Usage**: `admin sync` or `admin sync --status`
- **Safe**: Read-only validation, no destructive operations

### 🔄 **Cache Bust** (`cache`) 
- **Purpose**: CloudFront cache invalidation
- **Features**: Smart scenarios, detailed logging, recent invalidation tracking
- **Usage**: 
  - `admin cache all` - Invalidate everything
  - `admin cache lore` - Lore pages only
  - `admin cache assets` - Static assets only
  - `admin cache --status` - Recent invalidations
- **AWS**: Requires CloudFront permissions and CLOUDFRONT_DISTRIBUTION_ID

### 📊 **Deployment Status** (`status`)
- **Purpose**: Comprehensive deployment and build monitoring
- **Features**: Local build check, ECR images, App Runner status
- **Usage**:
  - `admin status` - Full status report
  - `admin status --quick` - Quick health check
- **AWS**: Requires ECR and App Runner read permissions

## 🚀 **Usage from CLI**

```bash
# Access admin mode
admin

# Execute specific tools
admin sync
admin cache all
admin status --quick

# Get recent cache invalidations
admin cache --status

# Quick deployment health check
admin status --quick
```

## 🔧 **Direct Execution**

```bash
# Run individual tools directly
node cli-admin-tools/sync-assets.js
node cli-admin-tools/cache-bust.js all
node cli-admin-tools/deployment-status.js --quick

# Get tool status
node cli-admin-tools/index.js --status
```

## 🌟 **Key Features**

### ✅ **Isolated & Safe**
- Completely separate from existing scripts
- No dependencies on potentially broken tools
- Production-grade error handling

### 🧠 **Smart & Context-Aware**
- Intelligent caching scenarios
- Comprehensive status reporting
- Detailed logging and tracking

### 🎯 **CLI Integrated**
- Seamless integration with content CLI
- Tab autocomplete for all commands
- Consistent user experience

### 📊 **Production Ready**
- Extensive error handling
- Detailed logging
- Status tracking and reporting

## 🔐 **Security**

- AWS credentials from environment
- No hardcoded secrets
- Read-only where possible
- Comprehensive validation

## 📁 **File Structure**

```
cli-admin-tools/
├── index.js              # Main toolkit orchestrator
├── sync-assets.js         # Asset synchronization
├── cache-bust.js          # CloudFront invalidation
├── deployment-status.js   # Status monitoring
└── README.md             # This documentation
```

## 🌊 **Wavelength Philosophy**

These tools embody the Wavelength development approach:
- **Reliability over complexity**
- **Isolation over integration** 
- **Clarity over cleverness**
- **Production-ready from day one**

Built for the ultimate content management and deployment experience! 🚀✨