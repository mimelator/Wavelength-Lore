# Environment Configuration Guide

## Overview

Wavelength Lore uses a multi-file environment configuration system to separate development and production settings safely.

## File Structure

```
.env                  # Base configuration (committed)
.env.production      # Production overrides (committed) 
.env.local          # Development overrides (git-ignored)
```

## File Priority

### Development (NODE_ENV !== 'production')
1. `.env` - Base configuration
2. `.env.local` - Local development overrides *(highest priority)*

### Production Deployment (App Runner)
1. `.env` - Base configuration  
2. `.env.production` - Production overrides *(highest priority)*
3. `.env.local` - **IGNORED** (never deployed)

## Common Use Cases

### Local Development Setup

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` for your local overrides:
   ```properties
   # .env.local - Your local development settings
   CDN_URL=http://localhost:3001
   ENABLE_BACKUPS=false
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_dev_key_here
   ```

### Production Deployment

1. Edit `.env.production` for production-specific values:
   ```properties
   # .env.production - Production settings
   CDN_URL="https://df5sj8f594cdx.cloudfront.net"
   PORT=8080
   ENABLE_BACKUPS=true
   ```

2. Deploy using the environment updater:
   ```bash
   npm run env:prod-preview  # Preview changes
   npm run env:prod-deploy   # Deploy to App Runner
   ```

## Key Benefits

✅ **Safe Local Development** - Override any setting without affecting production
✅ **Production Security** - `.env.local` never gets deployed
✅ **Version Control Safe** - Local settings stay private
✅ **Easy Deployment** - Production overrides are committed and consistent

## Available Scripts

```bash
# Development
npm run env:dev          # Show current environment setup

# Production Deployment  
npm run env:prod-preview # Preview production environment changes
npm run env:prod-deploy  # Deploy environment to App Runner (requires --force)

# Legacy App Runner Scripts
npm run apprunner:env        # Interactive mode
npm run apprunner:env:force  # Force update (old method)
npm run apprunner:env:dry    # Dry run (old method)
```

## File Examples

### `.env` (Base Configuration)
```properties
# Firebase Configuration
PROJECT_ID="wavelength-lore"
DATABASE_URL="https://wavelength-lore-default-rtdb.firebaseio.com"

# Default CDN (production)
CDN_URL="https://df5sj8f594cdx.cloudfront.net"

# Default settings
NODE_PORT=3001
NGINX_PORT=8080
```

### `.env.production` (Production Overrides)
```properties
# Ensure production CDN
CDN_URL="https://df5sj8f594cdx.cloudfront.net"

# App Runner health check
PORT=8080

# Production security
ADMIN_ALLOWED_IPS=*
ENABLE_BACKUPS=true
```

### `.env.local` (Development Overrides) - *Git Ignored*
```properties
# Local development CDN  
CDN_URL=http://localhost:3001

# Disable backups locally
ENABLE_BACKUPS=false

# Local AI settings
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-dev-key...

# Local Firebase (if using dev project)
PROJECT_ID=wavelength-lore-dev
```

## Important Notes

⚠️ **Never commit `.env.local`** - It's git-ignored for security
⚠️ **Always test with `env:prod-preview`** before deploying
⚠️ **Production values in `.env.production`** take precedence over `.env` when deploying

## Troubleshooting

### "Local setting deployed to production"
- Check if the setting is in `.env.production` 
- Use `npm run env:prod-preview` to see what will be deployed

### "Environment not loading"
- Ensure files exist and have proper syntax
- Check server startup logs for loading confirmation
- Verify NODE_ENV setting

### "Port mismatch errors"
- Ensure `PORT=8080` is in `.env.production`
- Run `npm run env:prod-deploy` to update App Runner
- Check CloudWatch logs with `npm run logs:service`