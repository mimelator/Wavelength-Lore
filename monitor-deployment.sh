#!/bin/bash

echo "🌊 WAVELENGTH: Monitoring deployment fix..."
echo "Checking GitHub Actions workflow..."

# Check if we can access the GitHub API
if command -v gh &> /dev/null; then
    echo "📊 Latest workflow runs:"
    gh run list --limit 3
    echo ""
    echo "🔍 Watching latest run..."
    gh run watch
else
    echo "⚠️ GitHub CLI not available. Please check manually:"
    echo "   https://github.com/mimelator/Wavelength-Lore/actions"
fi

echo ""
echo "🎯 Expected fix: Docker startup script syntax error resolved"
echo "🔧 Fixed: Malformed echo statement in docker/docker-start.sh"
echo "✅ Should resolve: /app/start.sh not found error"