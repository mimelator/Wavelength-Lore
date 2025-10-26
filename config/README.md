# Configuration Files

This directory contains configuration files for the Wavelength Lore application.

## Product Catalog System

### Active Files:
- **`product-types.js`** - Main product catalog with 142 validated blueprint-provider combinations
- **`printify-blueprints-discovered.json`** - Raw blueprint discovery data (708 blueprints)
- **`printify-config.js`** - Printify API configuration and credentials

### Backup Files:
- **`product-types.js.backup`** - Previous version backup
- **`product-types-master-structured.js.backup`** - Development backup

### System Overview:
The product catalog uses a sophisticated validation system that tests all Printify blueprints against available print providers to ensure reliable product creation. Only validated combinations are included in the final catalog.

**Total Products Available**: 142 validated combinations  
**Total Blueprints Tested**: 708  
**Success Rate**: 20.06%

For detailed documentation, see: `/docs/BLUEPRINT_VENDOR_VALIDATION_SYSTEM.md`

## 📁 Files Overview

### Firebase Configuration
- **`firebase.json`** - Firebase project configuration and hosting rules
- **`firebase-database-rules.json`** - Firebase Realtime Database security rules
- **`firebase-database-rules-enhanced.json`** - Enhanced Firebase security rules with additional protections

### Web Server Configuration
- **`nginx.conf`** - Nginx reverse proxy configuration for production deployment

### Firebase Rules Files
- **`.firebase.rules.json`** - Compiled Firebase rules (if exists)

## 🔧 Usage

### Firebase Deployment
```bash
# Deploy Firebase rules (from project root)
firebase deploy --only database

# Deploy hosting (from project root)
firebase deploy --only hosting
```

### Nginx Configuration
```bash
# Test nginx configuration
nginx -t -c config/nginx.conf

# Reload nginx with new config
nginx -s reload
```

## 🔒 Security Notes

- **Firebase rules** define database access permissions
- **Nginx config** handles SSL/TLS and reverse proxy settings
- Review all configurations before deploying to production
- Test rule changes in Firebase emulator first

## 📋 Configuration Management

### Environment-Specific Configs
- **Development**: Use Firebase emulator with local rules
- **Staging**: Deploy to staging Firebase project first
- **Production**: Thoroughly test before deploying

### Version Control
- All configuration files are version controlled
- Use descriptive commit messages for config changes
- Document any breaking changes in commit descriptions

---

**Note**: Keep sensitive configuration values in environment variables, not in these files.