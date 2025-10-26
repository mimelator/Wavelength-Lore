# 🚀 Wavelength Lore Deployment & Cache Management Guide

## Overview

This guide covers the complete deployment and cache management system for Wavelength Lore, including asset synchronization, cache busting, production deployment, and deployment tracking.

## 📋 Quick Reference Commands

### 🔥 Deployment Commands

```bash
# Full Production Deployment (Recommended)
npm run deploy:full        # Assets + CDN cache + deploy + status

# Quick Deployment (Code changes only)
npm run deploy:quick       # Local cache + deploy (fastest for hotfixes)

# Force Deployment (Manual trigger)
npm run deploy:force       # Just trigger App Runner deployment

# Asset Sync Only
npm run deploy:assets      # Upload CSS/JS/images to S3/CDN
```

### 🧹 Cache Management

```bash
# Complete Cache Clear
npm run cache:all          # Clear local + invalidate CDN (most thorough)

# Selective Cache Management
npm run cache:local        # Clear local application caches only
npm run cache:cdn          # Invalidate CloudFront CDN cache only
npm run cache:characters   # Clear character cache only
npm run cache:lore         # Clear lore cache only

# Direct Cache Script
npm run cache:bust         # Run full cache busting script with options
```

### 📊 Deployment Tracking & Monitoring

```bash
# Status & Comparison
npm run deploy:status      # Show current build information
npm run deploy:compare     # Compare local build vs production
npm run deploy:history     # View deployment history
npm run deploy:record      # Manually record current deployment
npm run deploy:auto-record # Auto-record if deployment is new
npm run deploy:post-hook   # Run post-deployment tasks & auto-record
```

## 🛠️ Advanced Deployment Manager

For more granular control, use the deployment manager directly:

```bash
# Full workflow management
node scripts/deploy-manager.js full     # Complete deployment workflow
node scripts/deploy-manager.js quick    # Quick deployment workflow
node scripts/deploy-manager.js assets   # Assets synchronization only
node scripts/deploy-manager.js status   # Check deployment status

# Cache management workflows
node scripts/deploy-manager.js cache local      # Local caches only
node scripts/deploy-manager.js cache cdn        # CDN invalidation only
node scripts/deploy-manager.js cache all        # All cache types
node scripts/deploy-manager.js cache characters # Character cache only
node scripts/deploy-manager.js cache lore       # Lore cache only

# Help and options
node scripts/deploy-manager.js help     # Show all available commands
```

## 📚 Workflow Scenarios

### 🏃‍♂️ Scenario 1: Quick Hotfix (Code Changes Only)

**Use Case**: Bug fixes, text changes, logic updates
**Command**: `npm run deploy:quick`

**What it does**:
1. Clears local application caches
2. Triggers App Runner deployment
3. Minimal downtime, fastest deployment

### 🚀 Scenario 2: Full Production Update (Assets + Code)

**Use Case**: New features, CSS/JS changes, image updates
**Command**: `npm run deploy:full`

**What it does**:
1. Syncs all static assets to S3 (CSS, JS, images, icons, fonts)
2. Invalidates CloudFront CDN cache
3. Triggers App Runner deployment
4. Shows deployment status

### 🧹 Scenario 3: Cache Issues / Performance Problems

**Use Case**: Stale content, caching issues, performance optimization
**Commands**: 
- `npm run cache:all` (nuclear option - clears everything)
- `npm run cache:characters` (specific content type)
- `npm run cache:local` (app-level only)
- `npm run cache:cdn` (CDN-level only)

### 📊 Scenario 4: Deployment Monitoring

**Use Case**: Checking deployment status, comparing versions
**Commands**:
- `npm run deploy:status` - Current build info
- `npm run deploy:compare` - Compare local vs production
- `npm run deploy:history` - Recent deployments

## 🔧 System Architecture

### Asset Synchronization (`deploy:assets`)
- **Source**: `./static/` directory
- **Destination**: S3 bucket `wavelength-lore-bucket`
- **CDN**: CloudFront distribution `df5sj8f594cdx.cloudfront.net`
- **Files Synced**: CSS, JS, images, icons, fonts, maps
- **Command**: `scripts/sync-assets.sh`

### Cache Management (`cache:*`)
- **Local Caches**: Character, lore, episode, prompt caches
- **CDN Cache**: CloudFront edge locations
- **Command**: `scripts/bust-cache.sh` with various flags
- **Scope**: Can target specific cache types or clear everything

### Production Deployment (`deploy:force`)
- **Platform**: AWS App Runner
- **Service**: Wavelength Lore production service
- **Process**: Pulls latest code, rebuilds container, deploys
- **Command**: `scripts/apprunner-force-deploy.js`
- **Tracking**: Provides operation ID for monitoring

### Deployment Tracking (`deploy:*`)
- **Storage**: `version.json` + `deployment-history.json`
- **Info Tracked**: Build number, git commit, timestamps, status
- **Auto-Recording**: Automatically detects and records new deployments
- **API**: `/api/deployment/status` endpoint
- **Commands**: `scripts/deployment-tracker.js` + `scripts/post-deploy-hook.js`

## 📁 Key Files & Scripts

### Core Scripts
- `scripts/deploy-manager.js` - Main deployment orchestrator
- `scripts/sync-assets.sh` - Asset synchronization to S3
- `scripts/bust-cache.sh` - Cache busting (local + CDN)
- `scripts/apprunner-force-deploy.js` - Production deployment
- `scripts/deployment-tracker.js` - Deployment tracking & comparison

### Configuration Files
- `package.json` - NPM script definitions
- `version.json` - Current build information
- `deployment-history.json` - Deployment history log
- `.env` - Environment variables & credentials

### API Endpoints
- `/api/deployment/status` - Deployment status & build info
- `/api/user/admin-status` - User authentication status

## 🚨 Troubleshooting

### Common Issues

**1. Asset Sync Fails**
```bash
# Check AWS credentials
npm run deploy:assets
# If fails, check .env file for ACCESS_KEY_ID and SECRET_ACCESS_KEY
```

**2. CDN Cache Not Clearing**
```bash
# Try local cache only first
npm run cache:local
# Then manual CDN invalidation
npm run cache:cdn
```

**3. Deployment Hangs**
```bash
# Check deployment status
npm run deploy:status
# Force new deployment
npm run deploy:force
```

**4. Firebase Errors in Production**
- Latest deployment includes Firebase initialization race condition fixes
- Check browser console for "Firebase initialized successfully" messages
- Use `npm run deploy:quick` to deploy Firebase fixes

### Debug Commands

```bash
# Verbose deployment manager output
node scripts/deploy-manager.js full

# Check current build vs production
npm run deploy:compare

# View recent deployment history
npm run deploy:history

# Manual deployment status check
npm run deploy:status
```

### AWS Credentials Priority

The system uses AWS credentials in this order:
1. `aws_wavelength_dev_access_key_id` / `aws_wavelength_dev_secret_access_key` (preferred for deployments)
2. `AWS_ACCESS_KEY_ADMIN` / `AWS_SECRET_ACCESS_KEY_ADMIN`
3. `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
4. `ACCESS_KEY_ID` / `SECRET_ACCESS_KEY`
5. Default AWS credential chain (profiles, IAM roles)

## 🔗 Related Resources

### Production URLs
- **Main Site**: https://vh9x3gevev.us-east-1.awsapprunner.com
- **CDN**: https://df5sj8f594cdx.cloudfront.net
- **Deployment API**: https://vh9x3gevev.us-east-1.awsapprunner.com/api/deployment/status

### AWS Resources
- **App Runner Service**: Wavelength Lore production service
- **S3 Bucket**: wavelength-lore-bucket (assets)
- **CloudFront Distribution**: df5sj8f594cdx.cloudfront.net
- **Region**: us-east-1

### Development
- **Local URL**: http://localhost:3001
- **Repository**: https://github.com/mimelator/Wavelength-Lore
- **Branch**: main

## 📝 Best Practices

### Deployment Workflow
1. **Test locally first**: Always run `npm start` and test changes
2. **Use appropriate deployment type**: 
   - `deploy:quick` for code-only changes
   - `deploy:full` for asset changes
3. **Monitor deployment**: Use `deploy:status` and `deploy:compare`
4. **Record deployments**: System auto-records, check with `deploy:history`

### Cache Management
1. **Start specific**: Use targeted cache clearing (e.g., `cache:characters`)
2. **Escalate if needed**: Move to `cache:local` then `cache:all`
3. **CDN timing**: CDN invalidation takes 5-15 minutes to propagate
4. **Monitor results**: Check production site after cache operations

### Version Control
1. **Commit first**: Always commit changes before deploying
2. **Push to main**: Deployments pull from GitHub main branch
3. **Track commits**: Footer shows clickable git commit links
4. **Compare builds**: Use `deploy:compare` to see differences

---

*Last updated: October 25, 2025*  
*System version: v1.0.171+*  
*Created by: Wavelength Development Team*