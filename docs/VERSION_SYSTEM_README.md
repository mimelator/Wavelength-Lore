# 🔖 Automatic Version System

## Overview
Implemented an automatic versioning system that increments with each commit to main and displays version information in both startup logs and the website footer.

## How It Works

### 📦 Version Management (`utils/version.js`)
- Centralized version utility that reads from `package.json` and `version.json`
- Provides consistent version information across the application
- Graceful fallbacks if version files don't exist
- Includes build metadata (commit hash, build number, environment)

### 🔄 GitHub Actions Auto-Increment (`.github/workflows/increment-version.yml`)
- **Triggers**: On every push to `main` branch
- **Skips**: Version bump commits (to avoid infinite loops)
- **Actions**:
  1. Increments patch version in `package.json`
  2. Creates/updates `version.json` with build metadata
  3. Commits changes with `[skip version]` flag
  4. Creates git tag (e.g., `v1.0.1`)
  5. Pushes changes back to repository

### 📊 Startup Logs (`index.js`)
Beautiful startup banner showing:
- Version number and commit hash
- Build number and environment
- Build date and Node.js version
- Git branch information

### 🌐 Website Footer (`views/partials/footer.ejs`)
Displays version badge with:
- Version number and short commit hash
- Tooltip with full build information
- Styled as a subtle badge with hover effects

## Version Information Structure

```json
{
  "version": "1.0.1",
  "buildDate": "2025-10-19T12:34:56Z",
  "commitHash": "abc123def456...",
  "commitShort": "abc123d",
  "buildNumber": "42",
  "environment": "production"
}
```

## Benefits

### 🎯 **Production Visibility**
- Immediately see which version is running in production logs
- Compare footer version with expected deployment
- Quick identification of successful deployments

### 🔍 **Debugging Support**
- Link issues to specific commits and builds
- Track deployment history through git tags
- Environment-specific version tracking

### 🚀 **Zero-Maintenance**
- Completely automated - no manual steps
- Consistent versioning across environments
- Automatic git tagging for releases

### 📋 **Compliance Ready**
- Full audit trail of deployments
- Build metadata for compliance reporting
- Traceable version history

## Testing

### Local Development
```bash
# Test version utility
node -e "const vm = require('./utils/version'); console.log(vm.getVersionInfo());"

# Test deploy script (shows current version)
cd scripts && ./deploy.sh
```

### Verify in Production
1. Check startup logs for version banner
2. Visit website footer for version badge
3. Compare with GitHub tags and build numbers

## Files Modified
- ✅ `utils/version.js` - Version management utility
- ✅ `index.js` - Startup logging and app.locals setup
- ✅ `views/partials/footer.ejs` - Footer version display
- ✅ `scripts/deploy.sh` - Updated to show version info
- ✅ `.github/workflows/increment-version.yml` - Auto-increment workflow
- ✅ `version.json` - Initial version metadata
- ✅ Removed `scripts/increment-version.sh` (replaced by GitHub Actions)

## Next Steps
1. **Commit and push** to trigger first auto-increment
2. **Verify** GitHub Actions workflow runs successfully
3. **Check** production logs show new version system
4. **Confirm** website footer displays version information