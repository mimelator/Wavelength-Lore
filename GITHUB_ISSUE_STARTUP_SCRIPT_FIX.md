# GitHub Issue: Docker Startup Script Mismatch Causing Production Failures

## Issue Summary
**Title**: Production builds failing due to incorrect Docker startup script selection  
**Status**: ✅ RESOLVED  
**Priority**: Critical  
**Labels**: `bug`, `docker`, `production`, `infrastructure`

## Problem Description
Production deployments were consistently failing with the error `/app/start.sh: not found`, causing App Runner to automatically rollback all deployments to the `:latest` tag. This created a cycle where no new deployments could succeed.

## Root Cause Analysis

### Technical Investigation
- **Error Pattern**: `/usr/local/bin/docker-entrypoint.sh: exec: line 11: /app/start.sh: not found`
- **Rollback Behavior**: App Runner automatically reverted all failed deployments
- **Initial Fix Attempt**: Changed Dockerfile COPY path from `docker/docker-start.sh` to `docker-start.sh`
- **Deeper Issue**: Wrong startup script was being used for production

### Discovery of Two Startup Scripts
Investigation revealed two different startup scripts with fundamentally different approaches:

**Production Script** (`docker/docker-start.sh` - 63 lines):
- Template-based configuration using environment variables
- Uses `envsubst '$NGINX_PORT $NODE_PORT'` for dynamic configuration
- Relies on `/etc/nginx/nginx.conf.template` for nginx setup
- Enhanced error handling and validation
- Proper environment variable substitution

**Development Script** (`docker-start.sh` - 91 lines):
- Hardcoded configuration values
- Generates nginx config inline with `cat > /etc/nginx/nginx.conf`
- Static port assignments (NODE_PORT=3001, NGINX_PORT=8080)
- Less flexible for different environments

### Issue Root Cause
The Dockerfile was modified to use the development script (`docker-start.sh`) instead of the production template-based script (`docker/docker-start.sh`), causing:
1. Loss of environment variable flexibility
2. Nginx configuration generation issues
3. Production startup process failures
4. App Runner health check failures leading to rollbacks

## Solution Implemented

### 1. Dockerfile Fix
```dockerfile
# Changed from:
COPY --chown=appuser:nodejs docker-start.sh /app/start.sh

# To:
COPY --chown=appuser:nodejs docker/docker-start.sh /app/start.sh
```

### 2. Enhanced Nginx Template
Updated `/config/nginx.conf.template` with:
- Comprehensive logging configuration
- Health check endpoints
- Proper proxy headers for App Runner
- Enhanced security settings

### 3. Startup Script Improvements
Modified `docker/docker-start.sh` to:
- Remove `sudo nginx` calls (run as appuser)
- Add proper `cd /app` before starting Node.js
- Implement proper daemon handling with `wait $NGINX_PID`
- Enhanced error reporting and validation

## Technical Details

### Environment Configuration
- **Node.js Port**: 3001 (configurable via NODE_PORT)
- **Nginx Port**: 8080 (configurable via NGINX_PORT)
- **Health Check**: Available on both ports
- **Process Management**: Background processes with proper PID tracking

### File Structure
```
/
├── docker-start.sh              # Development script (hardcoded)
├── docker/docker-start.sh       # Production script (template-based) ✅
└── config/nginx.conf.template   # Enhanced nginx template ✅
```

### Deployment Flow
1. Docker builds with production startup script
2. Environment variables injected by App Runner
3. Template substitution generates nginx configuration
4. Node.js starts on configurable port
5. Nginx proxies from external port to Node.js
6. Health checks validate both services

## Verification
- ✅ Docker build completes successfully
- ✅ Container startup process works correctly
- ✅ Environment variable substitution functions
- ✅ Nginx configuration generates properly
- ✅ Health checks respond on correct ports
- ✅ App Runner deployments no longer rollback

## Prevention Measures
1. **Documentation**: Clear distinction between development and production startup scripts
2. **Testing**: Container startup validation in CI/CD pipeline
3. **Monitoring**: Enhanced logging for startup process debugging
4. **Rollback Detection**: Smart deployment logic prevents infinite rollback cycles

## Files Modified
- `Dockerfile`: Corrected startup script path
- `config/nginx.conf.template`: Enhanced configuration
- `docker/docker-start.sh`: Improved process management and error handling

## Commit Hash
`7cab472` - 🔧 CRITICAL FIX: Use correct production startup script

---
**Resolution Date**: October 26, 2025  
**Impact**: Critical production deployment capability restored  
**Status**: ✅ COMPLETED