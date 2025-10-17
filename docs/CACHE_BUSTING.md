# Wavelength Lore - Cache Busting Guide

This document describes all the available methods for busting caches in the Wavelength Lore application.

## 🎯 Cache Types

- **Character Cache**: Stores character data from Firebase (names, descriptions, images, etc.)
- **Lore Cache**: Stores lore data from Firebase (places, things, concepts, ideas)
- **CloudFront CDN Cache**: Caches static assets (images, CSS, JS) served via AWS CloudFront

## 🛠️ Methods Available

### 1. Command Line Script (Node.js)

**File**: `bust-cache.js`

```bash
# Clear all caches (characters + lore)
node bust-cache.js

# Clear specific cache type
node bust-cache.js --characters
node bust-cache.js --lore

# Clear and immediately refresh from database
node bust-cache.js --all --refresh
node bust-cache.js --lore --refresh

# Get help
node bust-cache.js --help
```

**Features**:
- ✅ Clears in-memory caches
- ✅ Optional immediate refresh from Firebase
- ✅ Selective cache targeting
- ✅ Detailed output and error handling

### 2. Shell Script (Comprehensive)

**File**: `bust-cache.sh`

```bash
# Clear local app caches only
./bust-cache.sh --local

# Clear CloudFront CDN cache only
./bust-cache.sh --cdn

# Clear both local and CDN caches
./bust-cache.sh --local --cdn

# Clear specific local cache types
./bust-cache.sh --local --characters
./bust-cache.sh --local --lore --refresh

# Get help
./bust-cache.sh --help
```

**Features**:
- ✅ Handles both local app caches AND CloudFront CDN
- ✅ Calls Node.js script for local caches
- ✅ Uses AWS CLI for CloudFront invalidation
- ✅ Comprehensive error checking

### 3. Web Interface

**URL**: `http://localhost:3001/cache-management`

**Features**:
- ✅ User-friendly web interface
- ✅ Real-time status updates
- ✅ Individual or bulk cache operations
- ✅ Cache status checking
- ✅ No command line required

**Available Actions**:
- Clear Character Cache
- Refresh Characters (clear + reload)
- Clear Lore Cache  
- Refresh Lore (clear + reload)
- Clear All Caches
- Refresh All (clear + reload both)
- Check Cache Status

### 4. REST API Endpoints

#### POST `/api/cache/bust`
```bash
curl -X POST http://localhost:3001/api/cache/bust \
  -H "Content-Type: application/json" \
  -d '{"type": "all", "refresh": true}'
```

**Parameters**:
- `type`: "characters", "lore", or "all"
- `refresh`: `true` to immediately reload from database

#### GET `/api/cache/bust/{type}`
```bash
# Clear all caches
curl http://localhost:3001/api/cache/bust

# Clear specific cache
curl http://localhost:3001/api/cache/bust/characters
curl http://localhost:3001/api/cache/bust/lore

# Clear and refresh
curl "http://localhost:3001/api/cache/bust/all?refresh=true"
```

#### GET `/api/cache/status`
```bash
curl http://localhost:3001/api/cache/status
```

Returns current cache state with item counts and sample IDs.

## 🚀 Quick Reference

| Task | Command | 
|------|---------|
| Clear everything | `./bust-cache.sh` |
| Clear app caches only | `node bust-cache.js` |
| Clear + refresh all | `node bust-cache.js --all --refresh` |
| Clear characters only | `node bust-cache.js --characters` |
| Clear lore only | `node bust-cache.js --lore` |
| Clear CDN cache | `./bust-cache.sh --cdn` |
| Web interface | Visit `/cache-management` |
| Check cache status | `curl localhost:3001/api/cache/status` |

## 🔧 When to Use

- **After importing new data**: Use `--refresh` to immediately load new content
- **When content seems stale**: Clear relevant cache to force fresh data load
- **After deploying new assets**: Clear CDN cache with `--cdn`
- **For development**: Use web interface for easy testing
- **For automation**: Use API endpoints in scripts/CI

## 📝 Notes

- Caches auto-expire after 5 minutes
- Clearing cache forces immediate reload on next request
- CDN cache busting requires AWS CLI configuration
- Fallback data is used when Firebase is unavailable
- Web interface requires the server to be running

## 🆘 Troubleshooting

**"Firebase not available"**: This is normal when running scripts standalone. Fallback data will be used.

**"AWS CLI not found"**: Install AWS CLI to use CDN cache busting features.

**API endpoints not working**: Ensure the server is running on the expected port.

**Permission denied on scripts**: Run `chmod +x bust-cache.sh` to make script executable.