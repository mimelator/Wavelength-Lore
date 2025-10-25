#!/bin/bash

# Verify production deployment
PROD_URL="https://wavelengthlore.com"

echo "🔍 Verifying Production Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if site is up
echo "📡 Checking site availability..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ Site is UP (HTTP $STATUS)"
else
  echo "   ❌ Site returned HTTP $STATUS"
  exit 1
fi

# Check version from homepage
echo ""
echo "📦 Checking version..."
VERSION=$(curl -s "$PROD_URL" | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
if [ ! -z "$VERSION" ]; then
  echo "   ✅ Version: $VERSION"
else
  echo "   ⚠️  Could not detect version"
fi

# Check characters page
echo ""
echo "👥 Checking characters page..."
CHAR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/characters")
if [ "$CHAR_STATUS" = "200" ]; then
  echo "   ✅ Characters page working (HTTP $CHAR_STATUS)"
  
  # Check if characters are visible
  CHAR_COUNT=$(curl -s "$PROD_URL/characters" | grep -o "character-card" | wc -l)
  echo "   ✅ Found $CHAR_COUNT characters on page"
else
  echo "   ❌ Characters page returned HTTP $CHAR_STATUS"
fi

# Check a specific character
echo ""
echo "🎭 Checking individual character page..."
ANDREW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/character/andrew")
if [ "$ANDREW_STATUS" = "200" ]; then
  echo "   ✅ Character page working (HTTP $ANDREW_STATUS)"
else
  echo "   ❌ Character page returned HTTP $ANDREW_STATUS"
fi

echo ""
echo "✅ Production verification complete!"
