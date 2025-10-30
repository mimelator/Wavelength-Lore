# 🌊 WAVELENGTH Manual Deploy Guide

## Quick Commands

```bash
# Full manual build and deploy
npm run deploy

# Or run directly
./scripts/manual-deploy.sh
```

## What It Does

1. **Prerequisites Check**
   - ✅ Validates Docker is running (starts it if needed)
   - ✅ Checks AWS CLI availability
   - ✅ Reports git status

2. **Version Management**
   - 📋 Reads current version from package.json
   - 🔗 Gets latest commit hash
   - 📅 Generates build timestamp
   - 📝 Updates version.json

3. **Docker Build**
   - 🐳 Builds multi-platform image (linux/amd64)
   - 🏷️ Tags with version + commit hash
   - 📦 Includes all enhanced cards fixes

4. **ECR Push**
   - 🔐 Logs into AWS ECR
   - 📤 Pushes versioned images
   - ✅ Confirms successful upload

5. **App Runner Deploy**
   - 🚀 Updates service configuration
   - 🔄 Initiates deployment operation
   - 📊 Monitors deployment progress

6. **Validation**
   - 🌐 Tests site accessibility
   - ✅ Updates deployment status
   - 🕵️ Provides verification steps

## Expected Output

```
🌊 WAVELENGTH MANUAL BUILD & DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Registry: 170023515523.dkr.ecr.us-east-1.amazonaws.com
🐳 Repository: wavelength-lore
🌍 Region: us-east-1

🔍 Step 1: Validating Prerequisites...
✅ Docker is running
✅ AWS CLI available
✅ Working directory is clean

📋 Step 2: Generating Version Information...
📦 Version: 1.1.52
🔗 Commit: d7a6ee5
✅ Version information updated

🐳 Step 3: Building Docker Image...
✅ Docker image built successfully

📤 Step 4: Pushing to ECR...
✅ Images pushed to ECR successfully

🚀 Step 5: Deploying to App Runner...
✅ App Runner deployment initiated
🆔 Operation ID: [operation-id]

📊 Step 6: Monitoring Deployment...
🎉 DEPLOYMENT SUCCESSFUL!
✅ Service is running with new image

🎯 Enhanced cards with pricing fixes should now be live!
```

## Verification Steps

After deployment completes:

1. **Visit merchandise page**: https://vh9x3gevev.us-east-1.awsapprunner.com/merchandise
2. **Open browser dev tools** (F12) → Console tab
3. **Look for canary logs**:
   - `🌟 [GORGEOUS MOCKUP] Using beautiful Printify mockup`
   - `✅ MerchandiseProductCardRenderer exported to window object`
4. **Check enhanced CSS loading**:
   - `enhanced-product-ui.css?v=1.1.52`
   - `gorgeous-mockups.css?v=1.1.52`
5. **Verify enhanced UI**:
   - Larger product cards with rounded corners
   - "🌟 High Quality Preview" badges on images
   - Dropdown selectors for multi-variant products
   - Proper pricing display ($15.04 not $1504.00)

## Troubleshooting

### Docker Issues
```bash
# If Docker fails to start
open -a Docker
# Wait for Docker Desktop to fully load
```

### AWS Issues
```bash
# Check AWS credentials
aws sts get-caller-identity

# Re-login to ECR if needed
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 170023515523.dkr.ecr.us-east-1.amazonaws.com
```

### Deployment Stuck
```bash
# Check App Runner status manually
aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa"
```

## Why This Bypasses GitHub Actions

- **GitHub Actions ECR tagging is broken** - images appear as "untagged"
- **App Runner not updating** - stuck on 16-day-old images
- **Direct deployment works** - full control over build/push/deploy process
- **Faster iteration** - no waiting for CI/CD pipeline

This script gives you complete control and immediate deployment of your enhanced cards! 🎉