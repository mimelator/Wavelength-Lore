# 🚨 Deployment Troubleshooting Guide

## Overview

This guide documents common deployment issues encountered with the Wavelength Lore project and their solutions, particularly focusing on AWS App Runner + ECR deployment challenges.

## 🔥 Critical Issues & Solutions

### ECR Image Caching Problems

#### Issue: App Runner Using Stale ECR Images
**Symptoms:**
- GitHub Actions build and push successfully
- ECR repository shows new image with `:latest` tag
- App Runner deployment appears successful
- Production shows old code/behavior

**Root Cause:**
App Runner aggressively caches `:latest` ECR tags and may not pull updated images even when they exist in ECR.

**Solution:**
Force App Runner to use commit-specific tags instead of `:latest`:

```bash
# Use the ECR tag update tool to force specific commit deployment
node scripts/update-ecr-tag.js

# This will:
# 1. Get current Git commit hash
# 2. Check if ECR image exists with that tag
# 3. Update App Runner to use the specific commit tag
# 4. Monitor deployment progress
```

#### Issue: 502 Bad Gateway Errors
**Symptoms:**
- App Runner shows "Running" status
- Health checks failing
- 502 Bad Gateway responses from production URL

**Common Causes:**
1. **Port Mismatch**: Nginx expecting different port than Node.js is using
2. **Environment Variables**: Missing or incorrect production environment variables
3. **Container Startup Issues**: Application failing to start properly

**Diagnostic Steps:**

1. **Check Port Configuration:**
```bash
# Analyze production port configuration
node scripts/production-port-diagnostic.js --fix

# Expected configuration:
# NODE_PORT=3001 (Node.js app)
# NGINX_PORT=8080 (Nginx reverse proxy)
```

2. **Check Environment Variables:**
```bash
# Check App Runner environment configuration
node scripts/check-production-env.js

# Verify critical variables are set:
# - NODE_ENV=production
# - NODE_PORT=3001
# - FIREBASE_DATABASE_URL
# - etc.
```

3. **Check App Runner Logs:**
- Go to AWS App Runner console
- Select your service
- View "Logs" tab for startup errors

### GitHub Actions Build Issues

#### Issue: Build Fails to Push to ECR
**Symptoms:**
- GitHub Actions shows failed status
- ECR push step fails
- No new images in ECR repository

**Solution:**
```bash
# Monitor GitHub Actions in real-time
node scripts/github-action-monitor.js --watch

# Common fixes:
# 1. Check AWS credentials in GitHub secrets
# 2. Verify ECR repository permissions
# 3. Check Dockerfile syntax
```

## 🛠️ Troubleshooting Tools

### 1. Complete Pipeline Monitor
**Purpose:** End-to-end monitoring from GitHub to production
```bash
node scripts/deployment-pipeline-monitor.js --reason "Troubleshooting deployment"
```

**What it does:**
- Monitors GitHub Actions workflow
- Tracks App Runner deployment
- Reports final status and any issues

### 2. ECR Tag Manager
**Purpose:** Force specific ECR image deployment
```bash
node scripts/update-ecr-tag.js
```

**Use cases:**
- App Runner using stale `:latest` image
- Need to deploy specific commit
- Bypass ECR caching issues

### 3. Source Configuration Analyzer
**Purpose:** Analyze App Runner source configuration
```bash
node scripts/force-code-deploy.js
```

**What it shows:**
- Current ECR image URI
- App Runner source type
- Configuration details

### 4. Production Diagnostics
**Purpose:** Check production port and environment configuration
```bash
node scripts/production-port-diagnostic.js --fix
node scripts/check-production-env.js
```

### 5. GitHub Actions Monitor
**Purpose:** Real-time GitHub Actions monitoring
```bash
node scripts/github-action-monitor.js --watch
```

## 📋 Troubleshooting Checklist

### When Deployment Fails

1. **□ Check GitHub Actions Status**
   ```bash
   node scripts/github-action-monitor.js
   ```

2. **□ Verify ECR Image Exists**
   ```bash
   # Check AWS ECR console for latest image
   # Look for image with current commit hash tag
   ```

3. **□ Force ECR Tag Update**
   ```bash
   node scripts/update-ecr-tag.js
   ```

4. **□ Check App Runner Status**
   ```bash
   # AWS App Runner console -> Service status
   # Look for deployment status and health checks
   ```

5. **□ Verify Port Configuration**
   ```bash
   node scripts/production-port-diagnostic.js
   ```

6. **□ Check Environment Variables**
   ```bash
   node scripts/check-production-env.js
   ```

7. **□ Review App Runner Logs**
   ```bash
   # AWS App Runner console -> Logs tab
   # Look for startup errors or port binding issues
   ```

### When 502 Bad Gateway Occurs

1. **□ Port Configuration Check**
   - Node.js should run on port 3001
   - Nginx should proxy 8080 → 3001
   - App Runner health check on port 8080

2. **□ Environment Variables**
   - NODE_PORT=3001
   - NGINX_PORT=8080
   - All Firebase credentials present

3. **□ Container Health**
   - Application starting successfully
   - No uncaught exceptions
   - Database connections working

## 🚀 Best Practices

### ECR Image Management
- **Use commit-specific tags** instead of `:latest` for production
- **Monitor GitHub Actions** before assuming ECR images are ready
- **Force tag updates** when App Runner shows stale behavior

### Deployment Strategy
- **Always use pipeline monitor** for complete visibility
- **Check both GitHub and App Runner** status independently
- **Keep deployment tools updated** as AWS services evolve

### Environment Management
- **Separate staging/production** environment variables
- **Document required variables** for each environment
- **Test port configuration** in development before production

## 📞 Emergency Response

### Production Down Scenario

1. **Immediate Assessment (2 minutes)**
   ```bash
   # Quick status check
   node scripts/deployment-pipeline-monitor.js
   ```

2. **Force Fresh Deployment (5 minutes)**
   ```bash
   # Force ECR tag update to bypass caching
   node scripts/update-ecr-tag.js
   ```

3. **Monitor Recovery (10 minutes)**
   ```bash
   # Watch deployment progress
   node scripts/github-action-monitor.js --watch
   ```

4. **Verify Resolution**
   - Check production URL responds correctly
   - Verify all features working
   - Monitor logs for any remaining issues

## 📚 Related Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Standard deployment procedures
- [Production Configuration](../config/README.md) - Environment setup
- [Scripts Documentation](../scripts/README.md) - Tool usage details

## 🔍 Debug Information

### Common Error Messages

**"502 Bad Gateway"**
- Port mismatch between Nginx and Node.js
- Application failed to start
- Health check failing

**"Service deployment failed"**
- ECR image not found
- Invalid environment configuration
- Resource limits exceeded

**"GitHub Actions failed"**
- Build errors in Dockerfile
- ECR push permissions
- Missing secrets/credentials

### Log Locations

- **GitHub Actions**: Repository → Actions tab
- **App Runner**: AWS Console → App Runner → Service → Logs
- **Application**: App Runner logs → Application logs
- **Nginx**: App Runner logs → System logs

---

*Last updated: Following resolution of ECR caching deployment issues*