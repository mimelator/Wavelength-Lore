# Production Validation Suite

A comprehensive validation system for testing the Wavelength Lore production website at `https://wavelengthlore.com`.

## 🚀 Quick Start

```bash
# Quick validation (recommended for CI/CD)
./validate-production.sh quick

# Standard validation (recommended for manual testing)
./validate-production.sh standard

# Full comprehensive validation (recommended before releases)
./validate-production.sh full
```

## � Admin Authentication & Rate Limit Bypass

The validation suite automatically uses admin authentication to bypass rate limiting when testing production:

### **Automatic Rate Limit Bypass**
- **Environment Variable**: Uses `ADMIN_SECRET_KEY` from `.env` file
- **Smart Detection**: Only applies admin auth for production URLs
- **Header Injection**: Adds `X-Admin-Key` header to all requests
- **Zero Configuration**: Works automatically if admin key is configured

### **Benefits**
- ✅ **No Rate Limiting**: Bypass all rate limits during testing
- ✅ **Fast Execution**: No artificial delays needed
- ✅ **Comprehensive Testing**: Test all routes without hitting limits
- ✅ **CI/CD Friendly**: Perfect for automated pipelines

### **Testing Rate Limit Bypass**
```bash
# Test admin authentication bypass
node test-admin-bypass.js

# Expected output shows admin bypass working:
# 🔑 Using admin authentication to bypass rate limits
```

### **Manual Testing Without Admin Auth**
If you need to test rate limiting behavior, temporarily remove the admin key:
```bash
# Temporarily unset admin key to test rate limits
unset ADMIN_SECRET_KEY
node check_route_links.js --prod
```

## �📋 Components

The production validation suite consists of **five main scripts**:

### 1. 🔍 **Production Validation Suite** (`production_validation.js`)
- **Main orchestrator** that runs all checkers
- Provides unified reporting and summary
- Supports multiple validation modes
- Returns appropriate exit codes for CI/CD integration

### 2. 🖼️ **Image Checker** (`check_broken_images.js --prod`)
- Tests all images across the website
- Categorizes images (navigation, carousel, banner, hero, etc.)
- Validates HTTP status codes and loading

### 3. 📁 **Static Resource Checker** (`check_static_resources.js --prod`)  
- Tests CSS, JavaScript, fonts, and icon files
- Validates external CDN resources
- Checks file availability and response codes

### 4. 🔗 **Route Link Checker** (`check_route_links.js --prod`)
- Scans EJS templates for internal links
- Tests route availability and HTTP responses
- Validates dynamic routes against database content

### 5. 🎵 **Audio File Checker** (`check_audio_files.js --prod`)
- Tests MP3 audio files for all episodes
- Validates audio URLs stored in Firebase database
- Checks file accessibility and content type validation
- Reports on missing or broken audio files

## 🎯 Usage Modes

### ⚡ **Quick Mode** (1-2 minutes)
```bash
./validate-production.sh quick
# OR
node production_validation.js --quick --skip-images --skip-static
```
- **Best for**: CI/CD pipelines, rapid feedback
- **Checks**: Route links and audio files only
- **Timeout**: 60 seconds per checker
- **Rate Limiting**: Automatically bypassed with admin authentication
- **Use case**: Pre-deployment validation

### 📊 **Standard Mode** (2-5 minutes)
```bash
./validate-production.sh standard
# OR  
node production_validation.js
```
- **Best for**: Regular production health checks
- **Checks**: Images, static resources, routes, and audio files
- **Timeout**: 120 seconds per checker
- **Rate Limiting**: Automatically bypassed with admin authentication
- **Use case**: Scheduled monitoring, manual testing

### 🔍 **Full Mode** (5-10 minutes)
```bash
./validate-production.sh full
# OR
node production_validation.js --full
```
- **Best for**: Comprehensive validation before releases
- **Checks**: All resources with extended timeouts
- **Timeout**: 300 seconds per checker  
- **Rate Limiting**: Automatically bypassed with admin authentication
- **Use case**: Pre-release validation, deep health checks

### 🛠️ **Custom Mode**
```bash
# Skip specific checkers
./validate-production.sh custom --skip-images
./validate-production.sh custom --skip-static --skip-routes
node production_validation.js --skip-images --skip-static
```
- **Best for**: Targeted testing of specific systems
- **Options**: `--skip-images`, `--skip-static`, `--skip-routes`
- **Use case**: Debugging specific issues

## 📊 Output & Exit Codes

### **Exit Codes**
- `0` - ✅ **All checks passed** (100% success rate)
- `1` - ⚠️ **Minor issues detected** (90%+ success rate)
- `2` - 🚨 **Critical issues detected** (<90% success rate)
- `130` - ⚠️ **Interrupted by user** (Ctrl+C)

### **Sample Output**
```
🎯 Production Validation Suite Starting...
🌐 Target: https://wavelengthlore.com
⚡ Mode: Standard
📊 Checks: 🖼️ Images, 📁 Static, 🔗 Routes

============================================================
🚀 Running Image Checker
============================================================
[Image checking output...]
✅ Image Checker completed successfully in 12.3s

============================================================
🚀 Running Static Resource Checker  
============================================================
[Static resource checking output...]
✅ Static Resource Checker completed successfully in 8.7s

============================================================
🚀 Running Route Link Checker
============================================================
[Route checking output...]
✅ Route Link Checker completed successfully in 5.2s

================================================================================
📊 PRODUCTION VALIDATION SUMMARY REPORT
================================================================================

🌐 Production URL: https://wavelengthlore.com
⏱️  Total Duration: 26.2s
📅 Validation Time: 2025-10-19T18:30:45.123Z

📋 Individual Results:
  ✅ Image Checker: 100% success (12.3s)
  ✅ Static Resource Checker: 100% success (8.7s)
  ⚠️ Route Link Checker: 79% success (5.2s)
    Issues: Broken route: /forum/guidelines, Broken route: /forum/help, Broken route: /forum/search

🎯 Overall Status:
   📊 Total Items Checked: 125
   ✅ Working: 122
   ❌ Broken: 3
   📈 Success Rate: 98%

⚠️  PRODUCTION VALIDATION: MINOR ISSUES
   Most systems working, but some issues detected.

📊 Validation completed in 26.2s
```

## 🔧 Integration Examples

### **GitHub Actions CI/CD**
```yaml
- name: Validate Production
  run: |
    cd scripts
    ./validate-production.sh quick
  if: github.ref == 'refs/heads/main'
```

### **Pre-deployment Check**
```bash
#!/bin/bash
echo "Running production validation before deployment..."
cd scripts
if ./validate-production.sh standard; then
    echo "✅ Production validation passed - proceeding with deployment"
    ./deploy.sh
else
    echo "❌ Production validation failed - aborting deployment"
    exit 1
fi
```

### **Scheduled Monitoring**
```bash
# Add to crontab for hourly checks
0 * * * * cd /path/to/wavelength-lore/scripts && ./validate-production.sh quick
```

### **Manual Testing Workflow**
```bash
# Before making changes
./validate-production.sh standard

# After deployment
./validate-production.sh full

# If issues found, check individual components
./check_route_links.js --prod
./check_broken_images.js --prod
```

## 🎯 Best Practices

### **Development Workflow**
1. **Before committing**: Run local validation
2. **After deployment**: Run quick production validation
3. **Before releases**: Run full production validation
4. **Regular monitoring**: Schedule quick validations

### **Troubleshooting**
```bash
# Check specific issues
./check_route_links.js --prod           # For broken links
./check_broken_images.js --prod         # For image issues  
./check_static_resources.js --prod      # For asset problems
./check_audio_files.js --prod           # For audio file issues

# Compare local vs production
./check_route_links.js                  # Local
./check_route_links.js --prod           # Production
./check_audio_files.js                  # Local audio
./check_audio_files.js --prod           # Production audio
```

### **Performance Optimization**
- Use **quick mode** for frequent checks
- Use **standard mode** for regular monitoring
- Use **full mode** only for comprehensive validation
- Skip specific checkers if not needed (`--skip-*`)

## 🔄 Updating

The validation suite automatically uses the latest versions of the individual checker scripts. To update:

1. Modify individual checkers (`check_*.js`)
2. The production validation suite will use the updated versions
3. Test with `./validate-production.sh custom --skip-*` for specific components

## 📈 Monitoring Integration

The validation suite is designed for integration with monitoring systems:

- **Exit codes** indicate success/failure levels
- **Structured output** for parsing by monitoring tools
- **Timeout handling** prevents hanging in CI/CD
- **Progress indicators** for long-running validations

Perfect for integration with tools like Nagios, DataDog, New Relic, or custom monitoring solutions!