# Debug & Diagnostic Scripts

This directory contains debug and diagnostic scripts for the Wavelength Lore application. These scripts are used for troubleshooting, data validation, and system verification.

## 🔧 Debug Scripts

### Character & Lore Debugging
- **`debug-character-linking.js`** - Debug character reference system and linking functionality
- **`debug-lucky-lore.js`** - Debug Lucky character lore data and connections
- **`debug-goblin-king-lore.js`** - Debug Goblin King character lore and episodes

### Episode Debugging
- **`debug-episodes.js`** - Debug episode data structure and keyword linking
- **`debug-goblin-episodes.js`** - Debug goblin-related episode content and linking
- **`debug-structure.js`** - Debug overall data structure and relationships

## 🔍 Verification Scripts

### Database Validation
- **`verify-database-keywords.js`** - Verify keyword consistency across database
- **`verify-firebase-security.js`** - Verify Firebase security rules and access controls
- **`final-verification.js`** - Comprehensive system verification and health check

### Content Validation
- **`check_post.js`** - Check and validate forum post content and structure

### Forum Integration Testing
- **`test-lore-forum-integration.js`** - Test lore-specific forum integration functionality
- **`test-all-forum-integrations.js`** - Comprehensive test of all content-to-forum integrations (episodes, characters, lore)

## 📋 Usage

### Running Debug Scripts
```bash
# Navigate to debug directory
cd debug

# Run any debug script
node debug-character-linking.js
node debug-episodes.js
node verify-database-keywords.js
```

### Running from Project Root
```bash
# Run debug scripts from project root
node debug/debug-character-linking.js
node debug/verify-firebase-security.js
```

## 🎯 Script Purposes

### Character System Debugging
Scripts for troubleshooting character reference systems, lore connections, and keyword linking functionality.

### Forum Integration Testing
Scripts for testing and validating the content-to-forum integration functionality across episodes, characters, and lore objects.

### Database Integrity
Scripts for verifying data consistency, security rules, and overall database health.

### Content Validation
Scripts for checking content structure, forum posts, and data relationships.

## 🚨 Important Notes

### Dependencies
- All scripts require `.env` configuration in project root
- Firebase scripts require `firebaseServiceAccountKey.json`
- Some scripts may require database access credentials

### Safety
- These are read-only diagnostic scripts (safe to run)
- No scripts modify production data unless explicitly noted
- Use caution when running verification scripts in production

### Development vs Production
- Debug scripts are intended for development environment
- Verification scripts can be used in both development and production
- Always test scripts in development before running in production

## 📊 Expected Output

### Debug Scripts
- Detailed logging of data structures
- Character and episode relationship mappings
- Keyword linking analysis
- Error identification and suggestions

### Verification Scripts
- Pass/fail status for each check
- Detailed error messages for failures
- Security rule validation results
- Database integrity reports

## 🔗 Related Documentation

- [Security Enhancement Guide](../docs/SECURITY_ENHANCEMENT_GUIDE.md)
- [Character Reference System](../docs/CHARACTER_REFERENCE_SYSTEM.md)
- [Lore System Documentation](../docs/LORE_SYSTEM_DOCUMENTATION.md)
- [Firebase Security Rules](../firebase-database-rules.json)

---

**Note**: These scripts are development tools. For production monitoring, use the main application's built-in logging and monitoring systems.