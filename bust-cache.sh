#!/bin/bash

# Wavelength Lore - Comprehensive Cache Busting Script
# Handles both local application caches and CloudFront CDN cache

echo "🧹 Wavelength Cache Busting Utility"
echo "=================================="

# Parse command line arguments
LOCAL_CACHE=false
CDN_CACHE=false
CHARACTERS=false
LORE=false
ALL=false
REFRESH=false

for arg in "$@"; do
  case $arg in
    --local)
      LOCAL_CACHE=true
      shift
      ;;
    --cdn)
      CDN_CACHE=true
      shift
      ;;
    --characters)
      CHARACTERS=true
      shift
      ;;
    --lore)
      LORE=true
      shift
      ;;
    --all)
      ALL=true
      shift
      ;;
    --refresh)
      REFRESH=true
      shift
      ;;
    --help|-h)
      echo ""
      echo "Usage: ./bust-cache.sh [options]"
      echo ""
      echo "Options:"
      echo "  --local        Clear local application caches (characters/lore)"
      echo "  --cdn          Invalidate CloudFront CDN cache"
      echo "  --characters   Clear character cache only (requires --local)"
      echo "  --lore         Clear lore cache only (requires --local)"
      echo "  --all          Clear all local caches (default for --local)"
      echo "  --refresh      Force refresh from database after clearing"
      echo "  --help, -h     Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./bust-cache.sh --local                    # Clear all local caches"
      echo "  ./bust-cache.sh --local --characters       # Clear character cache only"
      echo "  ./bust-cache.sh --local --all --refresh    # Clear and refresh all caches"
      echo "  ./bust-cache.sh --cdn                      # Invalidate CloudFront cache"
      echo "  ./bust-cache.sh --local --cdn              # Clear both local and CDN caches"
      echo ""
      exit 0
      ;;
  esac
done

# Default to all if no specific cache type specified
if [ "$LOCAL_CACHE" = true ] && [ "$CHARACTERS" = false ] && [ "$LORE" = false ]; then
  ALL=true
fi

# Default to both local and CDN if no cache type specified
if [ "$LOCAL_CACHE" = false ] && [ "$CDN_CACHE" = false ]; then
  LOCAL_CACHE=true
  CDN_CACHE=true
  ALL=true
fi

# Handle local cache busting
if [ "$LOCAL_CACHE" = true ]; then
  echo ""
  echo "🏠 Busting Local Application Caches..."
  
  # Build node command arguments
  NODE_ARGS=""
  if [ "$CHARACTERS" = true ]; then
    NODE_ARGS="$NODE_ARGS --characters"
  fi
  if [ "$LORE" = true ]; then
    NODE_ARGS="$NODE_ARGS --lore"
  fi
  if [ "$ALL" = true ]; then
    NODE_ARGS="$NODE_ARGS --all"
  fi
  if [ "$REFRESH" = true ]; then
    NODE_ARGS="$NODE_ARGS --refresh"
  fi
  
  # Run the Node.js cache busting script
  if command -v node &> /dev/null; then
    node bust-cache.js $NODE_ARGS
    if [ $? -eq 0 ]; then
      echo "✅ Local cache busting completed successfully"
    else
      echo "❌ Local cache busting failed"
      exit 1
    fi
  else
    echo "❌ Node.js not found. Cannot bust local caches."
    exit 1
  fi
fi

# Handle CDN cache busting
if [ "$CDN_CACHE" = true ]; then
  echo ""
  echo "☁️  Busting CloudFront CDN Cache..."
  
  # Define CloudFront variables
  DISTRIBUTION_ID="E2QFR8E7I4A6ZT"
  AWS_REGION="us-east-1"
  
  # Check if AWS CLI is available
  if command -v aws &> /dev/null; then
    # Invalidate the CloudFront cache
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    
    # Confirm the invalidation
    if [ $? -eq 0 ]; then
      echo "✅ CloudFront cache invalidation created successfully for distribution: $DISTRIBUTION_ID"
    else
      echo "❌ Failed to create CloudFront cache invalidation"
      exit 1
    fi
  else
    echo "❌ AWS CLI not found. Cannot bust CloudFront cache."
    echo "💡 Install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
  fi
fi

echo ""
echo "🎉 Cache busting completed!"
echo ""